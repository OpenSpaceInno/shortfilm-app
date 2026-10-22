import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansRepository } from '../repositories/subscription-plans.repository';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionPlan } from '../../../database/schema';

describe('SubscriptionPlansService', () => {
  let service: SubscriptionPlansService;
  let plansRepo: jest.Mocked<SubscriptionPlansRepository>;
  let subsRepo: jest.Mocked<SubscriptionsRepository>;

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
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
  };

  const mockAnnualPlan: SubscriptionPlan = {
    id: '01HQTESTPLAN00000000000002',
    name: 'VIP Annual',
    slug: 'vip-annual',
    tier: 'VIP',
    description: 'Best value 44% savings',
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
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockPlansRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countActive: jest.fn(),
    };

    const mockSubsRepo = {
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countSubscribersByPlanId: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlansService,
        { provide: SubscriptionPlansRepository, useValue: mockPlansRepo },
        { provide: SubscriptionsRepository, useValue: mockSubsRepo },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SubscriptionPlansService>(SubscriptionPlansService);
    plansRepo = module.get(SubscriptionPlansRepository);
    subsRepo = module.get(SubscriptionsRepository);
  });

  describe('getActivePlans', () => {
    it('should return catalog of active plans formatted as response DTOs', async () => {
      plansRepo.findAll.mockResolvedValue([mockPlan, mockAnnualPlan]);

      const result = await service.getActivePlans();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('VIP Monthly');
      expect(result[0].priceMonthly).toBe(149);
      expect(result[0].entitlementMatrix.unlimitedEpisodes).toBe(true);
      expect(result[1].name).toBe('VIP Annual');
      expect(result[1].priceAnnually).toBe(999);
      expect(plansRepo.findAll).toHaveBeenCalledWith({});
    });

    it('should filter by billing interval if provided', async () => {
      plansRepo.findAll.mockResolvedValue([mockAnnualPlan]);

      const result = await service.getActivePlans({ interval: 'ANNUAL' });

      expect(result).toHaveLength(1);
      expect(result[0].billingInterval).toBe('ANNUAL');
      expect(plansRepo.findAll).toHaveBeenCalledWith({ interval: 'ANNUAL' });
    });
  });

  describe('getPlanBySlug', () => {
    it('should return plan when found by slug', async () => {
      plansRepo.findBySlug.mockResolvedValue(mockPlan);

      const result = await service.getPlanBySlug('vip-monthly');

      expect(result.slug).toBe('vip-monthly');
      expect(result.tier).toBe('VIP');
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      plansRepo.findBySlug.mockResolvedValue(null);

      await expect(service.getPlanBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPlanById', () => {
    it('should return plan when found by id', async () => {
      plansRepo.findById.mockResolvedValue(mockAnnualPlan);

      const result = await service.getPlanById('01HQTESTPLAN00000000000002');

      expect(result.id).toBe('01HQTESTPLAN00000000000002');
      expect(result.name).toBe('VIP Annual');
    });

    it('should throw NotFoundException when id does not exist', async () => {
      plansRepo.findById.mockResolvedValue(null);

      await expect(service.getPlanById('missing_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEntitlementMatrix', () => {
    it('should return feature entitlement comparison matrix with all active platform features', () => {
      const result = service.getEntitlementMatrix();

      expect(result.totalFeatures).toBeGreaterThanOrEqual(8);
      expect(result.features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ featureKey: 'premium_episodes' }),
          expect.objectContaining({ featureKey: 'ad_free' }),
          expect.objectContaining({ featureKey: 'streaming_resolution' }),
          expect.objectContaining({ featureKey: 'early_access' }),
          expect.objectContaining({ featureKey: 'exclusive_choices' }),
          expect.objectContaining({ featureKey: 'prediction_multiplier' }),
          expect.objectContaining({ featureKey: 'concurrent_devices' }),
          expect.objectContaining({ featureKey: 'offline_downloads' }),
        ]),
      );
    });
  });

  describe('createPlan', () => {
    it('should create new plan successfully when slug is unique', async () => {
      plansRepo.findBySlug.mockResolvedValue(null);
      plansRepo.create.mockImplementation(async (data) => ({
        ...mockPlan,
        ...data,
      } as SubscriptionPlan));

      const result = await service.createPlan({
        name: 'Student VIP',
        slug: 'student-vip',
        tier: 'STUDENT',
        priceMonthly: 49,
        currency: 'INR',
        billingInterval: 'MONTHLY',
        features: ['Student Discount'],
      });

      expect(result.name).toBe('Student VIP');
      expect(plansRepo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if plan slug already exists', async () => {
      plansRepo.findBySlug.mockResolvedValue(mockPlan);

      await expect(
        service.createPlan({
          name: 'VIP Monthly Duplicate',
          slug: 'vip-monthly',
          tier: 'VIP',
          priceMonthly: 149,
          currency: 'INR',
          billingInterval: 'MONTHLY',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePlan', () => {
    it('should update plan fields successfully', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      plansRepo.update.mockResolvedValue({
        ...mockPlan,
        priceMonthly: '199.00' as any,
      });

      const result = await service.updatePlan(mockPlan.id, {
        priceMonthly: 199,
      });

      expect(result.priceMonthly).toBe(199);
      expect(plansRepo.update).toHaveBeenCalledWith(
        mockPlan.id,
        expect.objectContaining({ priceMonthly: '199.00' }),
      );
    });

    it('should throw ConflictException if updated slug conflicts with another plan', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      plansRepo.findBySlug.mockResolvedValue(mockAnnualPlan);

      await expect(
        service.updatePlan(mockPlan.id, {
          slug: 'vip-annual',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAdminPlans', () => {
    it('should return admin plans enriched with subscriber counts', async () => {
      plansRepo.findAll.mockResolvedValue([mockPlan]);
      subsRepo.countSubscribersByPlanId.mockResolvedValue(54200);

      const result = await service.getAdminPlans();

      expect(result).toHaveLength(1);
      expect(result[0].subscriberCount).toBe(54200);
      expect(subsRepo.countSubscribersByPlanId).toHaveBeenCalledWith(mockPlan.id);
    });
  });
});
