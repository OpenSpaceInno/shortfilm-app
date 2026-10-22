import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository, SubscriptionWithPlan } from '../repositories/subscriptions.repository';
import { EntitlementsRepository } from '../repositories/entitlements.repository';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlan } from '../../../database/schema';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subsRepo: jest.Mocked<SubscriptionsRepository>;
  let entitlementsRepo: jest.Mocked<EntitlementsRepository>;
  let plansService: SubscriptionPlansService;

  const mockPlan: SubscriptionPlan = {
    id: '01HQTESTPLAN00000000000001',
    name: 'VIP Monthly',
    slug: 'vip-monthly',
    tier: 'VIP',
    description: 'Ad-free 1080p',
    priceMonthly: '149.00' as any,
    priceAnnually: null,
    currency: 'INR',
    billingInterval: 'MONTHLY',
    trialDays: 0,
    features: ['All VIP perks'],
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

  const createMockSub = (
    status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED',
    currentPeriodEnd: Date = new Date(Date.now() + 86400000),
    gracePeriodEnd?: Date,
  ): SubscriptionWithPlan => ({
    id: '01HQTESTSUB00000000000001',
    userId: '01HQTESTUSER0000000000001',
    planId: mockPlan.id,
    status,
    billingInterval: 'MONTHLY',
    provider: 'RAZORPAY',
    providerSubId: 'sub_test123',
    currentPeriodStart: new Date(Date.now() - 86400000),
    currentPeriodEnd,
    gracePeriodEnd: gracePeriodEnd || null,
    cancelledAt: status === 'CANCELLED' ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: mockPlan,
  });

  beforeEach(async () => {
    const mockSubsRepo = {
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countSubscribersByPlanId: jest.fn(),
    };

    const mockEntitlementsRepo = {
      findActiveByUserId: jest.fn(),
      hasEntitlement: jest.fn(),
      create: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: mockSubsRepo },
        { provide: EntitlementsRepository, useValue: mockEntitlementsRepo },
        {
          provide: SubscriptionPlansService,
          useValue: {
            mapToResponseDto: jest.fn().mockImplementation((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              tier: p.tier,
              priceMonthly: Number(p.priceMonthly),
              currency: p.currency,
              billingInterval: p.billingInterval,
              features: p.features,
              entitlementMatrix: p.entitlementMatrix,
            })),
          },
        },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subsRepo = module.get(SubscriptionsRepository);
    entitlementsRepo = module.get(EntitlementsRepository);
    plansService = module.get(SubscriptionPlansService);
  });

  describe('getCurrentUserSubscription', () => {
    it('should return isVip: false and status: NONE when user has no subscription and no entitlements', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(false);
      expect(result.status).toBe('NONE');
      expect(result.entitlements).toEqual([]);
    });

    it('should return isVip: true when user has explicit VIP_ACCESS entitlement even without active subscription', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      entitlementsRepo.findActiveByUserId.mockResolvedValue([
        {
          id: 'ent_1',
          userId: 'user_123',
          planId: null,
          entitlementCode: 'VIP_ACCESS',
          source: 'PROMO',
          expiresAt: new Date(Date.now() + 86400000),
          isActive: true,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(true);
      expect(result.status).toBe('NONE');
      expect(result.entitlements).toHaveLength(1);
      expect(result.entitlements[0].code).toBe('VIP_ACCESS');
    });

    it('should return isVip: true for an ACTIVE subscription', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('ACTIVE'));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(result.tier).toBe('VIP');
      expect(result.planName).toBe('VIP Monthly');
    });

    it('should return isVip: true for TRIAL subscription', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('TRIAL'));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(true);
      expect(result.status).toBe('TRIAL');
    });

    it('should return isVip: true for PAST_DUE subscription within 3-day grace period', async () => {
      const futureGrace = new Date(Date.now() + 2 * 86400000);
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('PAST_DUE', new Date(), futureGrace));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(true);
      expect(result.status).toBe('PAST_DUE');
    });

    it('should return isVip: false for PAST_DUE subscription whose grace period has expired', async () => {
      const pastGrace = new Date(Date.now() - 3600000);
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('PAST_DUE', new Date(), pastGrace));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(false);
      expect(result.status).toBe('PAST_DUE');
    });

    it('should return isVip: true for CANCELLED subscription when period has not yet elapsed', async () => {
      const futurePeriodEnd = new Date(Date.now() + 5 * 86400000);
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('CANCELLED', futurePeriodEnd));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const result = await service.getCurrentUserSubscription('user_123');

      expect(result.isVip).toBe(true);
      expect(result.status).toBe('CANCELLED');
      expect(result.isCancelled).toBe(true);
    });
  });

  describe('canAccessEpisode', () => {
    it('should allow access to free episodes unconditionally', async () => {
      const canAccess = await service.canAccessEpisode(null, true);
      expect(canAccess).toBe(true);
    });

    it('should disallow access to premium episodes when user is anonymous', async () => {
      const canAccess = await service.canAccessEpisode(null, false);
      expect(canAccess).toBe(false);
    });

    it('should allow access to premium episodes when user has active VIP', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('ACTIVE'));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const canAccess = await service.canAccessEpisode('user_123', false);
      expect(canAccess).toBe(true);
    });

    it('should disallow access to premium episodes when user subscription is expired', async () => {
      subsRepo.findActiveByUserId.mockResolvedValue(createMockSub('EXPIRED', new Date(Date.now() - 86400000)));
      entitlementsRepo.findActiveByUserId.mockResolvedValue([]);

      const canAccess = await service.canAccessEpisode('user_123', false);
      expect(canAccess).toBe(false);
    });
  });
});
