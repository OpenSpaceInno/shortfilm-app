import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SubscriptionPlansRepository } from '../repositories/subscription-plans.repository';
import { SubscriptionsRepository, SubscriptionWithPlan } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { PaymentTransactionsRepository } from '../repositories/payment-transactions.repository';
import { PaymentGatewayAdapter } from '../gateways/payment-gateway.adapter';
import { SubscriptionsService } from './subscriptions.service';
import {
  InitiateCheckoutDto,
  CheckoutSessionResponseDto,
  VerifyCheckoutDto,
  CheckoutVerificationResponseDto,
  CancelSubscriptionDto,
  CancellationResponseDto,
} from '../dto';
import {
  SubscriptionPlan,
  BillingInterval,
  PaymentProvider,
  SubscriptionStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly plansRepository: SubscriptionPlansRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly entitlementsRepository: EntitlementsRepository,
    private readonly transactionsRepository: PaymentTransactionsRepository,
    private readonly gatewayAdapter: PaymentGatewayAdapter,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly logger: Logger,
  ) {}

  /**
   * Initiates a new subscription checkout flow
   */
  async initiateCheckout(
    userId: string,
    userEmail: string | undefined,
    dto: InitiateCheckoutDto,
  ): Promise<CheckoutSessionResponseDto> {
    this.logger.log({ msg: 'Initiating subscription checkout', userId, planId: dto.planId });

    // 1. Validate Plan
    const plan = await this.plansRepository.findById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Subscription plan with ID '${dto.planId}' not found or is inactive`);
    }

    // 2. Prevent duplicate active subscription to the same plan
    const activeSub = await this.subscriptionsRepository.findActiveByUserId(userId);
    if (activeSub && activeSub.planId === plan.id && activeSub.status === 'ACTIVE') {
      throw new ConflictException('You already have an active subscription to this plan');
    }

    // 3. Resolve interval and compute price
    const interval: BillingInterval = dto.billingInterval || plan.billingInterval;
    let amount = 0;
    if (interval === 'ANNUAL') {
      amount = plan.priceAnnually ? Number(plan.priceAnnually) : Number(plan.priceMonthly) * 12;
    } else if (interval === 'MONTHLY') {
      amount = Number(plan.priceMonthly);
    }

    const provider: PaymentProvider = dto.provider || 'RAZORPAY';
    const now = new Date();
    const hasTrial = plan.trialDays > 0;
    const isFree = amount === 0;

    // Period calculation
    let periodEnd: Date;
    if (hasTrial) {
      periodEnd = new Date(now.getTime() + plan.trialDays * 86400000);
    } else if (interval === 'ANNUAL') {
      periodEnd = new Date(now.getTime() + 365 * 86400000);
    } else {
      periodEnd = new Date(now.getTime() + 30 * 86400000);
    }

    const initialStatus: SubscriptionStatus = hasTrial ? 'TRIAL' : isFree ? 'ACTIVE' : 'TRIAL';

    // 4. Create or update subscription record
    let subscription: SubscriptionWithPlan;
    const subId = generateUlid();

    const createdSub = await this.subscriptionsRepository.create({
      id: subId,
      userId,
      planId: plan.id,
      status: initialStatus,
      billingInterval: interval,
      provider,
      providerSubId: null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      gracePeriodEnd: null,
      cancelledAt: null,
    });
    subscription = (await this.subscriptionsRepository.findById(createdSub.id))!;

    // 5. If plan is Free or has a free trial, immediately provision entitlements
    if (isFree || hasTrial || provider === 'MANUAL') {
      await this.provisionPlanEntitlements(userId, plan, periodEnd);
    }

    // 6. Generate Gateway Checkout Session
    const sessionResult = await this.gatewayAdapter.createCheckoutSession(provider, {
      userId,
      userEmail,
      plan,
      billingInterval: interval,
      amount,
      currency: plan.currency,
      returnUrl: dto.returnUrl,
      idempotencyKey: dto.idempotencyKey,
    });

    // 7. Record payment transaction entry
    const transactionId = generateUlid();
    await this.transactionsRepository.create({
      id: transactionId,
      userId,
      subscriptionId: subscription.id,
      idempotencyKey: dto.idempotencyKey || null,
      provider,
      externalTransactionId: null,
      externalEventId: sessionResult.sessionId,
      eventType: 'CHECKOUT_INITIATED',
      amount: amount.toFixed(2),
      currency: plan.currency,
      status: isFree || hasTrial ? 'PROCESSED' : 'PENDING',
      payloadJson: (sessionResult.metadata as Record<string, unknown>) || null,
    });

    return {
      checkoutUrl: sessionResult.checkoutUrl,
      sessionId: sessionResult.sessionId,
      orderId: sessionResult.externalOrderId,
      provider: sessionResult.provider,
      subscriptionId: subscription.id,
      status: subscription.status,
      planName: plan.name,
      amount,
      currency: plan.currency,
      billingInterval: interval,
      metadata: sessionResult.metadata,
    };
  }

  /**
   * Verifies external payment and activates full VIP entitlements
   */
  async verifyCheckout(
    userId: string,
    dto: VerifyCheckoutDto,
  ): Promise<CheckoutVerificationResponseDto> {
    this.logger.log({ msg: 'Verifying checkout payment', userId, subId: dto.subscriptionId });

    // 1. Fetch Subscription
    const subscription = await this.subscriptionsRepository.findById(dto.subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      throw new NotFoundException(`Subscription '${dto.subscriptionId}' not found for current user`);
    }

    const provider: PaymentProvider = dto.provider || subscription.provider as PaymentProvider;

    // 2. Gateway verification
    const isValid = await this.gatewayAdapter.verifyPayment(provider, {
      orderId: dto.orderId,
      paymentId: dto.paymentId,
      signature: dto.signature,
      sessionId: dto.sessionId,
    });

    if (!isValid) {
      throw new BadRequestException('Payment verification failed or invalid payment signature');
    }

    // 3. Compute active period
    const now = new Date();
    const periodEnd =
      subscription.billingInterval === 'ANNUAL'
        ? new Date(now.getTime() + 365 * 86400000)
        : new Date(now.getTime() + 30 * 86400000);

    // 4. Update subscription to ACTIVE
    await this.subscriptionsRepository.update(subscription.id, {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerSubId: dto.paymentId || dto.sessionId || subscription.providerSubId,
      gracePeriodEnd: null,
    });

    // 5. Provision Entitlements
    await this.provisionPlanEntitlements(userId, subscription.plan, periodEnd);

    // 6. Update payment transaction
    const transactions = await this.transactionsRepository.findBySubscriptionId(subscription.id);
    if (transactions.length > 0) {
      await this.transactionsRepository.update(transactions[0].id, {
        status: 'PROCESSED',
        externalTransactionId: dto.paymentId || dto.sessionId || null,
      });
    }

    const updatedProfile = await this.subscriptionsService.getCurrentUserSubscription(userId);

    return {
      success: true,
      message: 'Payment verified and VIP subscription activated successfully!',
      subscription: updatedProfile,
    };
  }

  /**
   * Cancels a user's active recurring subscription
   */
  async cancelSubscription(
    userId: string,
    dto: CancelSubscriptionDto,
  ): Promise<CancellationResponseDto> {
    this.logger.log({ msg: 'Canceling user subscription', userId, reason: dto.reason });

    const activeSub = await this.subscriptionsRepository.findActiveByUserId(userId);
    if (!activeSub) {
      throw new NotFoundException('No active subscription found to cancel');
    }

    if (activeSub.status === 'CANCELLED') {
      return {
        success: true,
        cancelledAt: activeSub.cancelledAt || new Date(),
        currentPeriodEnd: activeSub.currentPeriodEnd || new Date(),
        message: 'Subscription is already cancelled and will expire at the end of the current period.',
      };
    }

    // Call external gateway cancel if externalSubId exists
    if (activeSub.providerSubId) {
      try {
        await this.gatewayAdapter.cancelSubscription(
          activeSub.provider as PaymentProvider,
          activeSub.providerSubId,
        );
      } catch (err) {
        this.logger.warn({ msg: 'Gateway cancellation warning', error: (err as Error).message });
      }
    }

    const now = new Date();
    await this.subscriptionsRepository.update(activeSub.id, {
      status: 'CANCELLED',
      cancelledAt: now,
    });

    return {
      success: true,
      cancelledAt: now,
      currentPeriodEnd: activeSub.currentPeriodEnd || now,
      message:
        'Subscription cancelled successfully. You retain full VIP access until the end of your billing cycle.',
    };
  }

  /**
   * Provisions all feature entitlements associated with a plan
   */
  private async provisionPlanEntitlements(
    userId: string,
    plan: SubscriptionPlan,
    expiresAt: Date,
  ): Promise<void> {
    this.logger.log({ msg: 'Provisioning entitlements for user and plan', userId, plan: plan.slug });

    // Revoke any existing expired/stale entitlements
    await this.entitlementsRepository.revokeAllForUser(userId);

    const entitlementsToGrant: string[] = [];

    if (plan.tier === 'VIP' || plan.tier === 'STUDENT' || plan.tier === 'LIFETIME') {
      entitlementsToGrant.push('VIP_ACCESS');
      entitlementsToGrant.push('PREMIUM_EPISODES');
      entitlementsToGrant.push('AD_FREE');
      entitlementsToGrant.push('EARLY_ACCESS');
      entitlementsToGrant.push('EXCLUSIVE_INTERACTIVE');
      entitlementsToGrant.push('OFFLINE_DOWNLOADS');

      if (plan.slug === 'vip-annual') {
        entitlementsToGrant.push('4K_STREAMING');
        entitlementsToGrant.push('GOLD_BADGE');
        entitlementsToGrant.push('CREATOR_AMAS');
      } else {
        entitlementsToGrant.push('FHD_STREAMING');
      }
    } else {
      // Free plan grants baseline rights
      entitlementsToGrant.push('FREE_TIER');
    }

    for (const code of entitlementsToGrant) {
      await this.subscriptionsService.grantEntitlement(
        userId,
        code,
        plan.tier === 'FREE' ? 'FREE' : 'SUBSCRIPTION',
        plan.id,
        expiresAt,
      );
    }
  }
}
