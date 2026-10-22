import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { generateUlid } from '../../../database/utils/ulid.util';
import { PaymentGatewayAdapter } from '../gateways/payment-gateway.adapter';
import { SubscriptionsRepository, SubscriptionWithPlan } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { PaymentTransactionsRepository } from '../repositories/payment-transactions.repository';
import { SubscriptionWebhooksRepository } from '../repositories/subscription-webhooks.repository';
import { WebhookAcknowledgmentDto } from '../dto/webhook-acknowledgment.dto';
import {
  PaymentProvider,
  SubscriptionStatus,
  BillingInterval,
} from '../../../database/schema';

// Standard 3-day grace period in milliseconds (P1-BR-005)
export const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

export const VALID_SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIAL: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
  ACTIVE: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
  PAST_DUE: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
  CANCELLED: ['EXPIRED'],
  EXPIRED: [],
};

@Injectable()
export class SubscriptionWebhooksService {
  private readonly logger = new Logger(SubscriptionWebhooksService.name);

  constructor(
    private readonly gatewayAdapter: PaymentGatewayAdapter,
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly entitlementsRepo: EntitlementsRepository,
    private readonly paymentTransactionsRepo: PaymentTransactionsRepository,
    private readonly webhooksRepo: SubscriptionWebhooksRepository,
  ) {}

  /**
   * Validates whether a state transition is legal according to the subscription state machine
   */
  canTransition(currentStatus: SubscriptionStatus, targetStatus: SubscriptionStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = VALID_SUBSCRIPTION_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Process incoming Razorpay webhook event idempotently
   */
  async processRazorpayWebhook(
    rawBody: string,
    signature: string,
    payload: any,
  ): Promise<WebhookAcknowledgmentDto> {
    // 1. Cryptographic HMAC-SHA256 signature verification
    const isValid = this.gatewayAdapter.verifyWebhookSignature('RAZORPAY', rawBody, signature);
    if (!isValid) {
      this.logger.warn('Razorpay webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Extract event metadata
    const eventType = payload?.event || 'unknown';
    const eventId =
      payload?.event_id ||
      payload?.id ||
      `rzp_${eventType}_${payload?.payload?.payment?.entity?.id || payload?.payload?.subscription?.entity?.id || Date.now()}`;

    return this.processIdempotentEvent('RAZORPAY', eventId, eventType, payload, async () => {
      await this.handleRazorpayEvent(eventType, payload);
    });
  }

  /**
   * Process incoming Stripe webhook event idempotently
   */
  async processStripeWebhook(
    rawBody: string,
    signature: string,
    payload: any,
  ): Promise<WebhookAcknowledgmentDto> {
    // 1. Cryptographic signature verification
    const isValid = this.gatewayAdapter.verifyWebhookSignature('STRIPE', rawBody, signature);
    if (!isValid) {
      this.logger.warn('Stripe webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Extract event metadata
    const eventType = payload?.type || 'unknown';
    const eventId = payload?.id || `stripe_${eventType}_${Date.now()}`;

    return this.processIdempotentEvent('STRIPE', eventId, eventType, payload, async () => {
      await this.handleStripeEvent(eventType, payload);
    });
  }

  /**
   * Core Idempotency pipeline: records receipt in webhook_events and prevents duplicate execution
   */
  private async processIdempotentEvent(
    provider: PaymentProvider,
    eventId: string,
    eventType: string,
    payload: any,
    handler: () => Promise<void>,
  ): Promise<WebhookAcknowledgmentDto> {
    // Check if event has already been registered in webhook_events
    const existing = await this.webhooksRepo.findByEventId(provider, eventId);
    if (existing) {
      this.logger.log(
        `[Idempotency Guard] Duplicate webhook event '${eventId}' from ${provider} received (status: ${existing.status}). Skipping execution.`,
      );
      return {
        received: true,
        eventId,
        status: 'ALREADY_PROCESSED',
        message: 'Event was previously processed or acknowledged',
      };
    }

    // Insert as RECEIVED in webhook_events
    const webhookEvent = await this.webhooksRepo.create({
      id: generateUlid(),
      provider,
      eventId,
      eventType,
      payload,
      status: 'RECEIVED',
    });

    try {
      // Execute the domain handler
      await handler();

      // Mark event PROCESSED
      await this.webhooksRepo.markProcessed(webhookEvent.id);

      return {
        received: true,
        eventId,
        status: 'PROCESSED',
        message: `Successfully processed ${eventType}`,
      };
    } catch (err: any) {
      this.logger.error(`Error processing ${provider} webhook '${eventId}': ${err.message}`, err.stack);
      await this.webhooksRepo.markFailed(webhookEvent.id);
      throw err;
    }
  }

  /**
   * Dispatches normalized Razorpay subscription and payment events
   */
  private async handleRazorpayEvent(eventType: string, payload: any): Promise<void> {
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;
    const subscriptionEntity = payload?.payload?.subscription?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;
    const providerSubId = subscriptionEntity?.id || orderId;
    const subscriptionId =
      paymentEntity?.notes?.subscription_id ||
      orderEntity?.notes?.subscription_id ||
      subscriptionEntity?.notes?.subscription_id;

    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;
        const currency = paymentEntity?.currency || 'INR';

        await this.handlePaymentSucceeded({
          provider: 'RAZORPAY',
          subscriptionId,
          providerSubId,
          orderId,
          paymentId,
          amount,
          currency,
          rawPayload: payload,
          isRecurring: false,
        });
        break;
      }

      case 'subscription.charged': {
        const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;
        const currency = paymentEntity?.currency || 'INR';
        const currentEndEpoch = subscriptionEntity?.current_end;
        const periodEnd = currentEndEpoch ? new Date(currentEndEpoch * 1000) : undefined;

        await this.handlePaymentSucceeded({
          provider: 'RAZORPAY',
          subscriptionId,
          providerSubId,
          orderId,
          paymentId,
          amount,
          currency,
          periodEnd,
          rawPayload: payload,
          isRecurring: true,
        });
        break;
      }

      case 'payment.failed': {
        const error =
          paymentEntity?.error_description ||
          paymentEntity?.error_code ||
          'Payment capture failed via Razorpay';

        await this.handlePaymentFailed({
          provider: 'RAZORPAY',
          subscriptionId,
          providerSubId,
          orderId,
          paymentId,
          errorMessage: error,
          rawPayload: payload,
        });
        break;
      }

      case 'subscription.cancelled': {
        await this.handleSubscriptionCancelled({
          provider: 'RAZORPAY',
          subscriptionId,
          providerSubId,
        });
        break;
      }

      case 'subscription.halted':
      case 'subscription.completed': {
        await this.handleSubscriptionExpired({
          provider: 'RAZORPAY',
          subscriptionId,
          providerSubId,
        });
        break;
      }

      default:
        this.logger.log(`Razorpay event '${eventType}' acknowledged with no subscription action required`);
        break;
    }
  }

  /**
   * Dispatches normalized Stripe subscription and invoice events
   */
  private async handleStripeEvent(eventType: string, payload: any): Promise<void> {
    const dataObj = payload?.data?.object;
    const providerSubId = dataObj?.subscription || dataObj?.id;
    const subscriptionId = dataObj?.metadata?.subscription_id;
    const paymentId = dataObj?.payment_intent || dataObj?.id;

    switch (eventType) {
      case 'invoice.payment_succeeded':
      case 'checkout.session.completed':
      case 'payment_intent.succeeded': {
        const amount = dataObj?.amount_paid || dataObj?.amount_total ? (dataObj.amount_paid || dataObj.amount_total) / 100 : undefined;
        const currency = (dataObj?.currency || 'INR').toUpperCase();
        const periodEndEpoch =
          dataObj?.lines?.data?.[0]?.period?.end ||
          dataObj?.current_period_end;
        const periodEnd = periodEndEpoch ? new Date(periodEndEpoch * 1000) : undefined;

        await this.handlePaymentSucceeded({
          provider: 'STRIPE',
          subscriptionId,
          providerSubId,
          paymentId,
          amount,
          currency,
          periodEnd,
          rawPayload: payload,
          isRecurring: eventType === 'invoice.payment_succeeded',
        });
        break;
      }

      case 'invoice.payment_failed':
      case 'payment_intent.payment_failed': {
        const errorMessage =
          dataObj?.last_payment_error?.message ||
          dataObj?.error?.message ||
          'Charge or invoice recurring payment failed on Stripe';

        await this.handlePaymentFailed({
          provider: 'STRIPE',
          subscriptionId,
          providerSubId,
          paymentId,
          errorMessage,
          rawPayload: payload,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        await this.handleSubscriptionCancelled({
          provider: 'STRIPE',
          subscriptionId,
          providerSubId,
        });
        break;
      }

      default:
        this.logger.log(`Stripe event '${eventType}' acknowledged with no subscription action required`);
        break;
    }
  }

  /**
   * Resolves target subscription by ID, providerSubId, or linked transaction orderId
   */
  async resolveSubscription(
    subscriptionId?: string,
    providerSubId?: string,
    orderId?: string,
  ): Promise<SubscriptionWithPlan | null> {
    if (subscriptionId) {
      const sub = await this.subscriptionsRepo.findById(subscriptionId);
      if (sub) return sub;
    }

    if (providerSubId) {
      const sub = await this.subscriptionsRepo.findByProviderSubId(providerSubId);
      if (sub) return sub;
    }

    if (orderId) {
      const tx = await this.paymentTransactionsRepo.findByOrderId(orderId);
      if (tx?.subscriptionId) {
        const sub = await this.subscriptionsRepo.findById(tx.subscriptionId);
        if (sub) return sub;
      }
    }

    return null;
  }

  /**
   * Handles successful payment charge / renewal
   * Transitions state machine -> ACTIVE, calculates period bounds, and provisions entitlements
   */
  async handlePaymentSucceeded(params: {
    provider: PaymentProvider;
    subscriptionId?: string;
    providerSubId?: string;
    orderId?: string;
    paymentId?: string;
    amount?: number;
    currency?: string;
    periodEnd?: Date;
    rawPayload?: any;
    isRecurring?: boolean;
  }): Promise<void> {
    const sub = await this.resolveSubscription(params.subscriptionId, params.providerSubId, params.orderId);
    if (!sub) {
      this.logger.warn(`Could not correlate subscription for payment success (subId: ${params.subscriptionId}, providerSubId: ${params.providerSubId})`);
      return;
    }

    // Verify valid state transition
    if (!this.canTransition(sub.status, 'ACTIVE')) {
      this.logger.warn(`Invalid state transition: Cannot transition subscription ${sub.id} from ${sub.status} to ACTIVE`);
      return;
    }

    const now = new Date();
    const periodEnd = params.periodEnd || this.calculateNextPeriodEnd(now, sub.billingInterval);

    // Update subscription record: status ACTIVE, reset grace period
    await this.subscriptionsRepo.update(sub.id, {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      gracePeriodEnd: null,
      providerSubId: params.providerSubId || sub.providerSubId,
    });

    // Provision or extend VIP entitlements
    await this.provisionOrExtendEntitlements(sub.userId, sub.planId, periodEnd);

    // Record or update transaction audit log
    const idempotencyKey = `${params.provider}_${params.paymentId || params.orderId || Date.now()}`;
    const existingTx = await this.paymentTransactionsRepo.findByIdempotencyKey(idempotencyKey);

    if (!existingTx) {
      await this.paymentTransactionsRepo.create({
        id: generateUlid(),
        idempotencyKey,
        subscriptionId: sub.id,
        userId: sub.userId,
        provider: params.provider,
        eventType: params.isRecurring ? 'SUBSCRIPTION_RENEWED' : 'PAYMENT_CAPTURED',
        amount: Number(params.amount || sub.plan.priceMonthly || 0).toFixed(2),
        currency: params.currency || sub.plan.currency || 'INR',
        status: 'PROCESSED',
        externalTransactionId: params.paymentId || null,
        externalEventId: params.orderId || params.providerSubId || null,
        payloadJson: (params.rawPayload as Record<string, unknown>) || null,
      });
    }

    this.logger.log(`Subscription ${sub.id} transitioned to ACTIVE through ${periodEnd.toISOString()}`);
  }

  /**
   * Handles payment failure (subscription renewal card declined, insufficient funds, etc.)
   * Transitions state machine -> PAST_DUE and applies 3-day grace period
   */
  async handlePaymentFailed(params: {
    provider: PaymentProvider;
    subscriptionId?: string;
    providerSubId?: string;
    orderId?: string;
    paymentId?: string;
    errorMessage?: string;
    rawPayload?: any;
  }): Promise<void> {
    const sub = await this.resolveSubscription(params.subscriptionId, params.providerSubId, params.orderId);
    if (!sub) {
      this.logger.warn(`Could not correlate subscription for payment failure (providerSubId: ${params.providerSubId})`);
      return;
    }

    // Verify valid state transition
    if (!this.canTransition(sub.status, 'PAST_DUE')) {
      this.logger.warn(`Invalid state transition: Cannot transition subscription ${sub.id} from ${sub.status} to PAST_DUE`);
      return;
    }

    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() + GRACE_PERIOD_MS);

    // Transition to PAST_DUE with 3-day grace period
    await this.subscriptionsRepo.update(sub.id, {
      status: 'PAST_DUE',
      gracePeriodEnd,
    });

    // Retain VIP access during grace period per specification (P1-BR-005)
    await this.entitlementsRepo.updateExpirationForUser(sub.userId, gracePeriodEnd);

    // Record failed payment transaction audit log
    const idempotencyKey = `${params.provider}_FAIL_${params.paymentId || params.orderId || Date.now()}`;
    await this.paymentTransactionsRepo.create({
      id: generateUlid(),
      idempotencyKey,
      subscriptionId: sub.id,
      userId: sub.userId,
      provider: params.provider,
      eventType: 'PAYMENT_FAILED',
      amount: Number(sub.plan.priceMonthly || 0).toFixed(2),
      currency: sub.plan.currency || 'INR',
      status: 'FAILED',
      externalTransactionId: params.paymentId || null,
      externalEventId: params.orderId || params.providerSubId || null,
      payloadJson: {
        ...(params.rawPayload || {}),
        errorMessage: params.errorMessage || 'Payment attempt failed',
      },
    });

    this.logger.warn(`Subscription ${sub.id} transitioned to PAST_DUE with grace period ending ${gracePeriodEnd.toISOString()}`);
  }

  /**
   * Handles subscription cancellation (auto-renew turned off)
   * User retains entitlement access until currentPeriodEnd
   */
  async handleSubscriptionCancelled(params: {
    provider: PaymentProvider;
    subscriptionId?: string;
    providerSubId?: string;
  }): Promise<void> {
    const sub = await this.resolveSubscription(params.subscriptionId, params.providerSubId);
    if (!sub) {
      this.logger.warn(`Could not correlate subscription for cancellation (providerSubId: ${params.providerSubId})`);
      return;
    }

    if (!this.canTransition(sub.status, 'CANCELLED')) {
      this.logger.warn(`Invalid state transition: Cannot transition subscription ${sub.id} from ${sub.status} to CANCELLED`);
      return;
    }

    const now = new Date();
    await this.subscriptionsRepo.update(sub.id, {
      status: 'CANCELLED',
      cancelledAt: now,
    });

    this.logger.log(`Subscription ${sub.id} cancelled. User retains entitlement access until ${sub.currentPeriodEnd?.toISOString() || 'period end'}`);
  }

  /**
   * Handles subscription expiration (grace period elapsed or period terminated)
   * Revokes user VIP entitlements immediately
   */
  async handleSubscriptionExpired(params: {
    provider: PaymentProvider;
    subscriptionId?: string;
    providerSubId?: string;
  }): Promise<void> {
    const sub = await this.resolveSubscription(params.subscriptionId, params.providerSubId);
    if (!sub) return;

    if (!this.canTransition(sub.status, 'EXPIRED')) {
      this.logger.warn(`Invalid state transition: Cannot transition subscription ${sub.id} from ${sub.status} to EXPIRED`);
      return;
    }

    await this.subscriptionsRepo.update(sub.id, {
      status: 'EXPIRED',
    });

    // Revoke all entitlements for this user
    await this.entitlementsRepo.revokeAllForUser(sub.userId);
    this.logger.log(`Subscription ${sub.id} expired. Entitlements for user ${sub.userId} revoked.`);
  }

  /**
   * Computes period expiration timestamp based on billing interval
   */
  private calculateNextPeriodEnd(startDate: Date, interval: BillingInterval): Date {
    const end = new Date(startDate.getTime());
    if (interval === 'ANNUAL') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setDate(end.getDate() + 30);
    }
    return end;
  }

  /**
   * Atomically provisions or extends feature entitlements
   */
  private async provisionOrExtendEntitlements(
    userId: string,
    planId: string,
    expiresAt: Date,
  ): Promise<void> {
    const existing = await this.entitlementsRepo.findActiveByUserId(userId);
    if (existing.length > 0) {
      await this.entitlementsRepo.updateExpirationForUser(userId, expiresAt);
      return;
    }

    // Default entitlement bundle for VIP subscribers
    const coreCodes = [
      'VIP_ACCESS',
      'PREMIUM_EPISODES',
      'AD_FREE',
      'EARLY_ACCESS',
      'EXCLUSIVE_INTERACTIVE',
    ];

    for (const code of coreCodes) {
      await this.entitlementsRepo.create({
        id: generateUlid(),
        userId,
        planId,
        entitlementCode: code,
        source: 'SUBSCRIPTION',
        expiresAt,
        isActive: true,
      });
    }
  }
}
