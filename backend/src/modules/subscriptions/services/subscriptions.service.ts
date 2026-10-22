import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { SubscriptionPlansService } from './subscription-plans.service';
import {
  CurrentSubscriptionResponseDto,
  UserEntitlementDto,
} from '../dto';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly entitlementsRepository: EntitlementsRepository,
    private readonly plansService: SubscriptionPlansService,
    private readonly logger: Logger,
  ) {}

  /**
   * Retrieves the current user's subscription profile, status, and active entitlements
   */
  async getCurrentUserSubscription(userId: string): Promise<CurrentSubscriptionResponseDto> {
    this.logger.log({ msg: 'Retrieving subscription profile for user', userId });

    const activeSub = await this.subscriptionsRepository.findActiveByUserId(userId);
    const rawEntitlements = await this.entitlementsRepository.findActiveByUserId(userId);

    const userEntitlements: UserEntitlementDto[] = rawEntitlements.map((e) => ({
      code: e.entitlementCode,
      source: e.source,
      expiresAt: e.expiresAt,
      isActive: e.isActive,
    }));

    if (!activeSub) {
      const hasExplicitVip = userEntitlements.some(
        (e) => e.code === 'VIP_ACCESS' && e.isActive,
      );

      return {
        isVip: hasExplicitVip,
        status: 'NONE',
        entitlements: userEntitlements,
      };
    }

    const now = new Date();
    let isVip = false;

    // Evaluate subscription state machine
    switch (activeSub.status) {
      case 'ACTIVE':
        isVip = true;
        break;
      case 'TRIAL':
        isVip = true;
        break;
      case 'PAST_DUE':
        // 3-day grace period
        isVip = activeSub.gracePeriodEnd ? activeSub.gracePeriodEnd > now : false;
        break;
      case 'CANCELLED':
        // Retains access until term ends
        isVip = activeSub.currentPeriodEnd ? activeSub.currentPeriodEnd > now : false;
        break;
      case 'EXPIRED':
      default:
        isVip = false;
        break;
    }

    // Explicit VIP entitlement can also grant access
    if (!isVip) {
      isVip = userEntitlements.some((e) => e.code === 'VIP_ACCESS' && e.isActive);
    }

    const planDto = this.plansService.mapToResponseDto(activeSub.plan);

    return {
      isVip,
      status: activeSub.status,
      tier: activeSub.plan.tier,
      planName: activeSub.plan.name,
      subscriptionId: activeSub.id,
      plan: planDto,
      billingInterval: activeSub.billingInterval,
      currentPeriodStart: activeSub.currentPeriodStart,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      gracePeriodEnd: activeSub.gracePeriodEnd,
      isCancelled: activeSub.status === 'CANCELLED' || Boolean(activeSub.cancelledAt),
      entitlements: userEntitlements,
    };
  }

  /**
   * Fast entitlement evaluator used by stream token authorization
   */
  async canAccessEpisode(userId: string | null | undefined, isFreeEpisode: boolean): Promise<boolean> {
    if (isFreeEpisode) {
      return true;
    }

    if (!userId) {
      return false;
    }

    const subProfile = await this.getCurrentUserSubscription(userId);
    return subProfile.isVip;
  }

  /**
   * Grants a feature entitlement directly to a user
   */
  async grantEntitlement(
    userId: string,
    entitlementCode: string,
    source = 'SUBSCRIPTION',
    planId?: string,
    expiresAt?: Date,
  ) {
    this.logger.log({ msg: 'Granting entitlement to user', userId, entitlementCode, source });
    return this.entitlementsRepository.create({
      id: generateUlid(),
      userId,
      planId: planId || null,
      entitlementCode,
      source,
      expiresAt: expiresAt || null,
      isActive: true,
      metadata: null,
    });
  }

  /**
   * Revokes an entitlement
   */
  async revokeEntitlement(id: string): Promise<boolean> {
    return this.entitlementsRepository.revoke(id);
  }
}
