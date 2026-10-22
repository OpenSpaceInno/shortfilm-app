import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { CheckoutService } from './checkout.service';
import { SubscriptionPlansRepository } from '../repositories/subscription-plans.repository';
import { SubscriptionsRepository, SubscriptionWithPlan } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { PaymentTransactionsRepository } from '../repositories/payment-transactions.repository';
import { PaymentGatewayAdapter } from '../gateways/payment-gateway.adapter';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan, Subscription } from '../../../database/schema';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let plansRepo: jest.Mocked<SubscriptionPlansRepository>;
  let subsRepo: jest.Mocked<SubscriptionsRepository>;
  let entitlementsRepo: jest.Mocked<EntitlementsRepository>;
  let transactionsRepo: jest.Mocked<PaymentTransactionsRepository>;
  let gatewayAdapter: jest.Mocked<PaymentGatewayAdapter>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;

  const mockPlan: SubscriptionPlan = {
    id: '01HQTESTPLAN00000000000001',
    name: 'VIP Monthly',
    slug: 'vip-monthly',
    tier: 'VIP',
    description: 'Ad-free 1080p all access',
    priceMonthly: '149.00' as any,
    priceAnnually: null,
    currency: 'INR',
    billingInterval: 'MONTHLY',
    trialDays: 0,
    features: ['All premium series', 'Ad-free', '1080p streaming'],
    entitlementMatrix: {
      unlimitedEpisodes: true,
      adFree: true,
      maxResolution: '1080p',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      predictionXpMultiplier: 2.0,
      maxConcurrentDevices: 2,
      offlineDownloads: true,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAnnualPlan: SubscriptionPlan = {
    id: '01HQTESTPLAN00000000000002',
    name: 'VIP Annual',
    slug: 'vip-annual',
    tier: 'VIP',
    description: 'Best value annual tier',
    priceMonthly: '83.25' as any,
    priceAnnually: '999.00' as any,
    currency: 'INR',
    billingInterval: 'ANNUAL',
    trialDays: 7,
    features: ['All VIP perks', '4K HDR', '7-day trial'],
    entitlementMatrix: {
      unlimitedEpisodes: true,
      adFree: true,
      maxResolution: '4K',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      predictionXpMultiplier: 2.0,
      maxConcurrentDevices: 4,
      offlineDownloads: true,
    },
    isActive: true,
    isPopular: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubWithPlan: SubscriptionWithPlan = {
    id: '01HQTESTSUB00000000000001',
    userId: 'user_123',
    planId: mockPlan.id,
    status: 'ACTIVE',
    billingInterval: 'MONTHLY',
    provider: 'RAZORPAY',
    providerSubId: 'pay_123',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    gracePeriodEnd: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: mockPlan,
  };

  beforeEach(async () => {
    const mockPlansRepo = {
      findById: jest.fn(),
    };

    const mockSubsRepo = {
      findActiveByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockEntitlementsRepo = {
      revokeAllForUser: jest.fn().mockResolvedValue(true),
    };

    const mockTransactionsRepo = {
      create: jest.fn().mockResolvedValue({} as any),
      findBySubscriptionId: jest.fn().mockResolvedValue([{ id: 'tx_1' }] as any),
      update: jest.fn().mockResolvedValue({} as any),
    };

    const mockGateway = {
      createCheckoutSession: jest.fn().mockResolvedValue({
        provider: 'RAZORPAY',
        sessionId: 'sess_123',
        checkoutUrl: 'https://checkout.razorpay.com/order_123',
        externalOrderId: 'order_123',
        amount: 149,
        currency: 'INR',
        metadata: {},
      }),
      verifyPayment: jest.fn().mockResolvedValue(true),
      cancelSubscription: jest.fn().mockResolvedValue(undefined),
    };

    const mockSubsService = {
      grantEntitlement: jest.fn().mockResolvedValue({} as any),
      getCurrentUserSubscription: jest.fn().mockResolvedValue({
        isVip: true,
        status: 'ACTIVE',
        tier: 'VIP',
        planName: 'VIP Monthly',
        entitlements: [],
      } as any),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: SubscriptionPlansRepository, useValue: mockPlansRepo },
        { provide: SubscriptionsRepository, useValue: mockSubsRepo },
        { provide: EntitlementsRepository, useValue: mockEntitlementsRepo },
        { provide: PaymentTransactionsRepository, useValue: mockTransactionsRepo },
        { provide: PaymentGatewayAdapter, useValue: mockGateway },
        { provide: SubscriptionsService, useValue: mockSubsService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    plansRepo = module.get(SubscriptionPlansRepository);
    subsRepo = module.get(SubscriptionsRepository);
    entitlementsRepo = module.get(EntitlementsRepository);
    transactionsRepo = module.get(PaymentTransactionsRepository);
    gatewayAdapter = module.get(PaymentGatewayAdapter);
    subscriptionsService = module.get(SubscriptionsService);
  });

  describe('initiateCheckout', () => {
    it('should create subscription record, gateway session, and transaction record', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      subsRepo.create.mockResolvedValue({ id: '01HQTESTSUB00000000000001' } as Subscription);
      subsRepo.findById.mockResolvedValue(mockSubWithPlan);

      const result = await service.initiateCheckout('user_123', 'user@shortreel.com', {
        planId: mockPlan.id,
        billingInterval: 'MONTHLY',
        provider: 'RAZORPAY',
      });

      expect(result.subscriptionId).toBe('01HQTESTSUB00000000000001');
      expect(result.amount).toBe(149);
      expect(result.checkoutUrl).toBe('https://checkout.razorpay.com/order_123');
      expect(gatewayAdapter.createCheckoutSession).toHaveBeenCalled();
      expect(transactionsRepo.create).toHaveBeenCalled();
    });

    it('should immediately provision entitlements for plans with free trial', async () => {
      plansRepo.findById.mockResolvedValue(mockAnnualPlan);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      subsRepo.create.mockResolvedValue({ id: '01HQTESTSUB00000000000002' } as Subscription);
      subsRepo.findById.mockResolvedValue({
        ...mockSubWithPlan,
        plan: mockAnnualPlan,
      });

      await service.initiateCheckout('user_123', 'user@shortreel.com', {
        planId: mockAnnualPlan.id,
        billingInterval: 'ANNUAL',
        provider: 'RAZORPAY',
      });

      expect(entitlementsRepo.revokeAllForUser).toHaveBeenCalledWith('user_123');
      expect(subscriptionsService.grantEntitlement).toHaveBeenCalledWith(
        'user_123',
        'VIP_ACCESS',
        'SUBSCRIPTION',
        mockAnnualPlan.id,
        expect.any(Date),
      );
    });

    it('should throw NotFoundException if plan does not exist or is inactive', async () => {
      plansRepo.findById.mockResolvedValue(null);

      await expect(
        service.initiateCheckout('user_123', 'user@shortreel.com', {
          planId: 'non_existent_plan',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already has an active subscription to the plan', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      subsRepo.findActiveByUserId.mockResolvedValue(mockSubWithPlan);

      await expect(
        service.initiateCheckout('user_123', 'user@shortreel.com', {
          planId: mockPlan.id,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyCheckout', () => {
    it('should verify payment signature, activate subscription, and provision entitlements', async () => {
      subsRepo.findById.mockResolvedValue(mockSubWithPlan);
      gatewayAdapter.verifyPayment.mockResolvedValue(true);

      const result = await service.verifyCheckout('user_123', {
        subscriptionId: mockSubWithPlan.id,
        provider: 'RAZORPAY',
        orderId: 'order_123',
        paymentId: 'pay_123',
        signature: 'valid_sig_123',
      });

      expect(result.success).toBe(true);
      expect(subsRepo.update).toHaveBeenCalledWith(
        mockSubWithPlan.id,
        expect.objectContaining({ status: 'ACTIVE', providerSubId: 'pay_123' }),
      );
      expect(subscriptionsService.grantEntitlement).toHaveBeenCalled();
      expect(transactionsRepo.update).toHaveBeenCalledWith(
        'tx_1',
        expect.objectContaining({ status: 'PROCESSED', externalTransactionId: 'pay_123' }),
      );
    });

    it('should throw BadRequestException if gateway verification fails', async () => {
      subsRepo.findById.mockResolvedValue(mockSubWithPlan);
      gatewayAdapter.verifyPayment.mockResolvedValue(false);

      await expect(
        service.verifyCheckout('user_123', {
          subscriptionId: mockSubWithPlan.id,
          provider: 'RAZORPAY',
          orderId: 'order_123',
          paymentId: 'pay_invalid',
          signature: 'bad_signature',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if subscription does not belong to user', async () => {
      subsRepo.findById.mockResolvedValue({
        ...mockSubWithPlan,
        userId: 'other_user',
      });

      await expect(
        service.verifyCheckout('user_123', {
          subscriptionId: mockSubWithPlan.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should mark active subscription as CANCELLED while retaining period end access', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(mockSubWithPlan);

      const result = await service.cancelSubscription('user_123', {
        reason: 'Finished current stories',
      });

      expect(result.success).toBe(true);
      expect(subsRepo.update).toHaveBeenCalledWith(
        mockSubWithPlan.id,
        expect.objectContaining({ status: 'CANCELLED', cancelledAt: expect.any(Date) }),
      );
    });

    it('should throw NotFoundException if no active subscription exists', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(null);

      await expect(
        service.cancelSubscription('user_123', {
          reason: 'Too expensive',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
