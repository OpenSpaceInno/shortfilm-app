import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  SubscriptionWebhooksService,
  GRACE_PERIOD_MS,
} from './subscription-webhooks.service';
import { PaymentGatewayAdapter } from '../gateways/payment-gateway.adapter';
import { SubscriptionsRepository, SubscriptionWithPlan } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { PaymentTransactionsRepository } from '../repositories/payment-transactions.repository';
import { SubscriptionWebhooksRepository } from '../repositories/subscription-webhooks.repository';
import { SubscriptionPlan } from '../../../database/schema';

describe('SubscriptionWebhooksService', () => {
  let service: SubscriptionWebhooksService;
  let gatewayAdapter: jest.Mocked<PaymentGatewayAdapter>;
  let subscriptionsRepo: jest.Mocked<SubscriptionsRepository>;
  let entitlementsRepo: jest.Mocked<EntitlementsRepository>;
  let paymentTransactionsRepo: jest.Mocked<PaymentTransactionsRepository>;
  let webhooksRepo: jest.Mocked<SubscriptionWebhooksRepository>;

  const samplePlan: SubscriptionPlan = {
    id: 'plan_vip_01',
    name: 'VIP Monthly',
    slug: 'vip-monthly',
    tier: 'VIP',
    description: 'Monthly VIP access',
    priceMonthly: '149.00',
    priceAnnually: null,
    currency: 'INR',
    billingInterval: 'MONTHLY',
    trialDays: 0,
    features: ['All VIP perks'],
    entitlementMatrix: {
      adFree: true,
      maxResolution: '1080p',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      offlineDownloads: true,
      unlimitedEpisodes: true,
      maxConcurrentDevices: 2,
      predictionXpMultiplier: 2,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleSubscription: SubscriptionWithPlan = {
    id: 'sub_01',
    userId: 'user_01',
    planId: 'plan_vip_01',
    status: 'TRIAL',
    billingInterval: 'MONTHLY',
    provider: 'RAZORPAY',
    providerSubId: 'order_rzp_123',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gracePeriodEnd: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: samplePlan,
  };

  beforeEach(async () => {
    gatewayAdapter = {
      verifyWebhookSignature: jest.fn(),
    } as any;

    subscriptionsRepo = {
      findById: jest.fn(),
      findByProviderSubId: jest.fn(),
      update: jest.fn(),
    } as any;

    entitlementsRepo = {
      findActiveByUserId: jest.fn(),
      updateExpirationForUser: jest.fn(),
      create: jest.fn(),
      revokeAllForUser: jest.fn(),
    } as any;

    paymentTransactionsRepo = {
      findByOrderId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
    } as any;

    webhooksRepo = {
      findByEventId: jest.fn(),
      create: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionWebhooksService,
        { provide: PaymentGatewayAdapter, useValue: gatewayAdapter },
        { provide: SubscriptionsRepository, useValue: subscriptionsRepo },
        { provide: EntitlementsRepository, useValue: entitlementsRepo },
        { provide: PaymentTransactionsRepository, useValue: paymentTransactionsRepo },
        { provide: SubscriptionWebhooksRepository, useValue: webhooksRepo },
      ],
    }).compile();

    service = module.get<SubscriptionWebhooksService>(SubscriptionWebhooksService);
  });

  describe('State Machine Invariants', () => {
    it('should validate allowed transitions', () => {
      expect(service.canTransition('TRIAL', 'ACTIVE')).toBe(true);
      expect(service.canTransition('ACTIVE', 'PAST_DUE')).toBe(true);
      expect(service.canTransition('PAST_DUE', 'ACTIVE')).toBe(true);
      expect(service.canTransition('ACTIVE', 'CANCELLED')).toBe(true);
      expect(service.canTransition('CANCELLED', 'EXPIRED')).toBe(true);
      expect(service.canTransition('ACTIVE', 'ACTIVE')).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      expect(service.canTransition('EXPIRED', 'ACTIVE')).toBe(false);
      expect(service.canTransition('CANCELLED', 'PAST_DUE')).toBe(false);
      expect(service.canTransition('EXPIRED', 'CANCELLED')).toBe(false);
    });
  });

  describe('Signature Verification', () => {
    it('should reject Razorpay webhook with invalid signature', async () => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.processRazorpayWebhook('{"event":"payment.captured"}', 'invalid_sig', {
          event: 'payment.captured',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject Stripe webhook with invalid signature', async () => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.processStripeWebhook('{"type":"invoice.payment_succeeded"}', 'invalid_sig', {
          type: 'invoice.payment_succeeded',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Idempotency Guard', () => {
    it('should skip duplicate webhook events if already recorded', async () => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(true);
      webhooksRepo.findByEventId.mockResolvedValue({
        id: 'wh_evt_01',
        provider: 'RAZORPAY',
        eventId: 'evt_dup_123',
        eventType: 'payment.captured',
        payload: {},
        status: 'PROCESSED',
        processedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.processRazorpayWebhook(
        '{}',
        'valid_sig',
        { event: 'payment.captured', event_id: 'evt_dup_123' },
      );

      expect(result.received).toBe(true);
      expect(result.status).toBe('ALREADY_PROCESSED');
      expect(webhooksRepo.create).not.toHaveBeenCalled();
    });

    it('should record event as RECEIVED and update to PROCESSED upon completion', async () => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(true);
      webhooksRepo.findByEventId.mockResolvedValue(null);
      webhooksRepo.create.mockResolvedValue({
        id: 'wh_new_01',
        provider: 'RAZORPAY',
        eventId: 'evt_new_123',
        eventType: 'payment.captured',
        payload: {},
        status: 'RECEIVED',
        processedAt: null,
        createdAt: new Date(),
      });
      subscriptionsRepo.findByProviderSubId.mockResolvedValue(sampleSubscription);
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.processRazorpayWebhook(
        '{}',
        'valid_sig',
        {
          event: 'payment.captured',
          event_id: 'evt_new_123',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                order_id: 'order_rzp_123',
                amount: 14900,
                currency: 'INR',
              },
            },
          },
        },
      );

      expect(result.received).toBe(true);
      expect(result.status).toBe('PROCESSED');
      expect(webhooksRepo.create).toHaveBeenCalled();
      expect(webhooksRepo.markProcessed).toHaveBeenCalledWith('wh_new_01');
    });

    it('should mark event as FAILED if processing throws error', async () => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(true);
      webhooksRepo.findByEventId.mockResolvedValue(null);
      webhooksRepo.create.mockResolvedValue({
        id: 'wh_fail_01',
        provider: 'RAZORPAY',
        eventId: 'evt_fail_123',
        eventType: 'payment.captured',
        payload: {},
        status: 'RECEIVED',
        processedAt: null,
        createdAt: new Date(),
      });
      subscriptionsRepo.findByProviderSubId.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.processRazorpayWebhook('{}', 'valid_sig', {
          event: 'payment.captured',
          event_id: 'evt_fail_123',
          payload: {
            payment: { entity: { id: 'pay_123', order_id: 'order_rzp_123' } },
          },
        }),
      ).rejects.toThrow('DB failure');

      expect(webhooksRepo.markFailed).toHaveBeenCalledWith('wh_fail_01');
    });
  });

  describe('Razorpay Event Handlers', () => {
    beforeEach(() => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(true);
      webhooksRepo.findByEventId.mockResolvedValue(null);
      webhooksRepo.create.mockResolvedValue({
        id: 'wh_01',
        provider: 'RAZORPAY',
        eventId: 'evt_test',
        eventType: 'test',
        payload: {},
        status: 'RECEIVED',
        processedAt: null,
        createdAt: new Date(),
      });
    });

    it('should transition subscription to ACTIVE and provision entitlements on payment.captured', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        status: 'TRIAL',
      });
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);
      paymentTransactionsRepo.findByIdempotencyKey.mockResolvedValue(null);

      await service.processRazorpayWebhook('{}', 'sig', {
        event: 'payment.captured',
        event_id: 'evt_pay_cap',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_999',
              order_id: 'order_rzp_123',
              amount: 14900,
              currency: 'INR',
            },
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'ACTIVE',
          gracePeriodEnd: null,
        }),
      );
      expect(entitlementsRepo.create).toHaveBeenCalledTimes(5);
      expect(paymentTransactionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'sub_01',
          status: 'PROCESSED',
          eventType: 'PAYMENT_CAPTURED',
        }),
      );
    });

    it('should advance period and extend entitlements on subscription.charged', async () => {
      const activeSub: SubscriptionWithPlan = {
        ...sampleSubscription,
        status: 'ACTIVE',
      };
      subscriptionsRepo.findByProviderSubId.mockResolvedValue(activeSub);
      entitlementsRepo.findActiveByUserId.mockResolvedValue([{ id: 'ent_01' } as any]);
      paymentTransactionsRepo.findByIdempotencyKey.mockResolvedValue(null);

      const futureEpoch = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

      await service.processRazorpayWebhook('{}', 'sig', {
        event: 'subscription.charged',
        event_id: 'evt_sub_charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_ext_1',
              current_end: futureEpoch,
            },
          },
          payment: {
            entity: {
              id: 'pay_renew_1',
              amount: 14900,
            },
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'ACTIVE',
          currentPeriodEnd: new Date(futureEpoch * 1000),
        }),
      );
      expect(entitlementsRepo.updateExpirationForUser).toHaveBeenCalledWith(
        'user_01',
        new Date(futureEpoch * 1000),
      );
      expect(paymentTransactionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SUBSCRIPTION_RENEWED',
          status: 'PROCESSED',
        }),
      );
    });

    it('should transition to PAST_DUE and set 3-day grace period on payment.failed', async () => {
      const activeSub: SubscriptionWithPlan = {
        ...sampleSubscription,
        status: 'ACTIVE',
      };
      subscriptionsRepo.findByProviderSubId.mockResolvedValue(activeSub);

      const before = Date.now();
      await service.processRazorpayWebhook('{}', 'sig', {
        event: 'payment.failed',
        event_id: 'evt_pay_failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_fail_1',
              order_id: 'order_rzp_123',
              error_description: 'Card expired or insufficient balance',
            },
          },
        },
      });
      const after = Date.now();

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'PAST_DUE',
          gracePeriodEnd: expect.any(Date),
        }),
      );

      // Verify 3-day grace period calculation
      const updateCall = subscriptionsRepo.update.mock.calls[0][1];
      const graceTime = updateCall.gracePeriodEnd!.getTime();
      expect(graceTime).toBeGreaterThanOrEqual(before + GRACE_PERIOD_MS);
      expect(graceTime).toBeLessThanOrEqual(after + GRACE_PERIOD_MS);

      // Verify user retains access during grace period
      expect(entitlementsRepo.updateExpirationForUser).toHaveBeenCalledWith(
        'user_01',
        updateCall.gracePeriodEnd,
      );

      // Verify failed transaction logged
      expect(paymentTransactionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          eventType: 'PAYMENT_FAILED',
          payloadJson: expect.objectContaining({
            errorMessage: 'Card expired or insufficient balance',
          }),
        }),
      );
    });

    it('should transition to CANCELLED on subscription.cancelled', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        status: 'ACTIVE',
      });

      await service.processRazorpayWebhook('{}', 'sig', {
        event: 'subscription.cancelled',
        event_id: 'evt_cancel',
        payload: {
          subscription: {
            entity: { id: 'order_rzp_123' },
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        }),
      );
    });

    it('should transition to EXPIRED and revoke entitlements on subscription.halted', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        status: 'PAST_DUE',
      });

      await service.processRazorpayWebhook('{}', 'sig', {
        event: 'subscription.halted',
        event_id: 'evt_halt',
        payload: {
          subscription: { entity: { id: 'order_rzp_123' } },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith('sub_01', {
        status: 'EXPIRED',
      });
      expect(entitlementsRepo.revokeAllForUser).toHaveBeenCalledWith('user_01');
    });
  });

  describe('Stripe Event Handlers', () => {
    beforeEach(() => {
      gatewayAdapter.verifyWebhookSignature.mockReturnValue(true);
      webhooksRepo.findByEventId.mockResolvedValue(null);
      webhooksRepo.create.mockResolvedValue({
        id: 'wh_stripe_01',
        provider: 'STRIPE',
        eventId: 'evt_stripe_test',
        eventType: 'test',
        payload: {},
        status: 'RECEIVED',
        processedAt: null,
        createdAt: new Date(),
      });
    });

    it('should handle invoice.payment_succeeded and set ACTIVE status', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        provider: 'STRIPE',
        status: 'PAST_DUE',
      });
      entitlementsRepo.findActiveByUserId.mockResolvedValue([{ id: 'ent_01' } as any]);
      paymentTransactionsRepo.findByIdempotencyKey.mockResolvedValue(null);

      const periodEndEpoch = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

      await service.processStripeWebhook('{}', 'stripe_sig', {
        type: 'invoice.payment_succeeded',
        id: 'evt_inv_succ_1',
        data: {
          object: {
            id: 'in_12345',
            subscription: 'sub_stripe_ext_1',
            amount_paid: 14900,
            currency: 'inr',
            lines: {
              data: [{ period: { end: periodEndEpoch } }],
            },
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'ACTIVE',
          gracePeriodEnd: null,
        }),
      );
    });

    it('should transition to PAST_DUE with 3-day grace period on invoice.payment_failed', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        provider: 'STRIPE',
        status: 'ACTIVE',
      });

      await service.processStripeWebhook('{}', 'stripe_sig', {
        type: 'invoice.payment_failed',
        id: 'evt_inv_fail_1',
        data: {
          object: {
            id: 'in_fail_123',
            subscription: 'sub_stripe_ext_1',
            last_payment_error: { message: 'Do Not Honor / Card declined' },
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'PAST_DUE',
          gracePeriodEnd: expect.any(Date),
        }),
      );
      expect(paymentTransactionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          eventType: 'PAYMENT_FAILED',
          payloadJson: expect.objectContaining({
            errorMessage: 'Do Not Honor / Card declined',
          }),
        }),
      );
    });

    it('should transition to CANCELLED on customer.subscription.deleted', async () => {
      subscriptionsRepo.findByProviderSubId.mockResolvedValue({
        ...sampleSubscription,
        provider: 'STRIPE',
        status: 'ACTIVE',
      });

      await service.processStripeWebhook('{}', 'stripe_sig', {
        type: 'customer.subscription.deleted',
        id: 'evt_sub_del_1',
        data: {
          object: {
            id: 'sub_stripe_ext_1',
          },
        },
      });

      expect(subscriptionsRepo.update).toHaveBeenCalledWith(
        'sub_01',
        expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        }),
      );
    });
  });
});
