import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreatorEarningsService } from './creator-earnings.service';
import { CreatorEarningsRepository } from '../repositories/creator-earnings.repository';
import { CreatorsRepository } from '../repositories/creators.repository';
import { CreatorVerificationsRepository } from '../repositories/creator-verifications.repository';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';

describe('CreatorEarningsService', () => {
  let service: CreatorEarningsService;
  let earningsRepo: jest.Mocked<CreatorEarningsRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let verificationsRepo: jest.Mocked<CreatorVerificationsRepository>;

  const mockCreator = {
    id: 'creator_01',
    userId: 'user_01',
    displayName: 'Aarav Patel',
    bio: 'Filmmaker',
    tier: 'EXCLUSIVE',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    earningsRepo = {
      findById: jest.fn(),
      findByCreatorAndMonth: jest.fn(),
      upsertSettlement: jest.fn(),
      findByCreatorId: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      getEarningsSummary: jest.fn(),
    } as any;

    creatorsRepo = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    } as any;

    verificationsRepo = {
      findLatestByCreatorId: jest.fn(),
    } as any;

    const mockDbService = {
      getDb: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorEarningsService,
        { provide: CreatorEarningsRepository, useValue: earningsRepo },
        { provide: CreatorsRepository, useValue: creatorsRepo },
        { provide: CreatorVerificationsRepository, useValue: verificationsRepo },
        { provide: DRIZZLE_DB, useValue: mockDbService },
      ],
    }).compile();

    service = module.get<CreatorEarningsService>(CreatorEarningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Financial Formulas (BR-001, LC-001)', () => {
    it('computePayoutSplit should compute default 30% platform fee and 10% tax withholding', () => {
      // Gross: 10,000 -> Platform fee: 3,000 (30%) -> Taxable: 7,000 -> Tax: 700 (10%) -> Net: 6,300
      const split = service.computePayoutSplit(10000, 30, 10);
      expect(split.grossAmount).toBe('10000.00');
      expect(split.platformFee).toBe('3000.00');
      expect(split.taxWithheld).toBe('700.00');
      expect(split.netPayout).toBe('6300.00');
    });

    it('computePayoutSplit should handle custom split parameters', () => {
      // Gross: 20,000 -> Fee 40% (8,000) -> Taxable: 12,000 -> Tax 15% (1,800) -> Net: 10,200
      const split = service.computePayoutSplit(20000, 40, 15);
      expect(split.grossAmount).toBe('20000.00');
      expect(split.platformFee).toBe('8000.00');
      expect(split.taxWithheld).toBe('1800.00');
      expect(split.netPayout).toBe('10200.00');
    });

    it('computePayoutSplit should handle 0 gross gracefully', () => {
      const split = service.computePayoutSplit(0);
      expect(split.grossAmount).toBe('0.00');
      expect(split.platformFee).toBe('0.00');
      expect(split.taxWithheld).toBe('0.00');
      expect(split.netPayout).toBe('0.00');
    });
  });

  describe('normalizePeriodMonth', () => {
    it('should format YYYY-MM to YYYY-MM-01', () => {
      expect(service.normalizePeriodMonth('2026-09')).toBe('2026-09-01');
    });

    it('should format YYYY-MM-DD to YYYY-MM-01', () => {
      expect(service.normalizePeriodMonth('2026-09-25')).toBe('2026-09-01');
    });
  });

  describe('runMonthlySettlement', () => {
    it('should calculate earnings and assign PENDING_PAYOUT when KYC is verified & above threshold', async () => {
      creatorsRepo.findAll.mockResolvedValue({
        items: [{ creator: mockCreator as any, profile: null }],
        total: 1,
      });

      verificationsRepo.findLatestByCreatorId.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreator.id,
        status: 'VERIFIED',
      } as any);

      earningsRepo.upsertSettlement.mockResolvedValue({} as any);

      const result = await service.runMonthlySettlement(
        {
          periodMonth: '2026-09-01',
          platformFeePercent: 30,
          taxWithholdingPercent: 10,
          minimumPayoutThreshold: 1000,
        },
        'admin_1',
      );

      expect(result.periodMonth).toBe('2026-09-01');
      expect(result.creatorsProcessed).toBe(1);
      expect(result.statusBreakdown.PENDING_PAYOUT).toBe(1);
      expect(earningsRepo.upsertSettlement).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: mockCreator.id,
          periodMonth: '2026-09-01',
          status: 'PENDING_PAYOUT',
          holdReason: null,
        }),
      );
    });

    it('should assign HELD status when creator KYC is not approved (LC-001)', async () => {
      creatorsRepo.findAll.mockResolvedValue({
        items: [{ creator: mockCreator as any, profile: null }],
        total: 1,
      });

      verificationsRepo.findLatestByCreatorId.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreator.id,
        status: 'PENDING', // Not approved
      } as any);

      earningsRepo.upsertSettlement.mockResolvedValue({} as any);

      const result = await service.runMonthlySettlement({
        periodMonth: '2026-09-01',
      });

      expect(result.statusBreakdown.HELD).toBe(1);
      expect(earningsRepo.upsertSettlement).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: mockCreator.id,
          status: 'HELD',
          holdReason: expect.stringContaining('KYC'),
        }),
      );
    });

    it('should not persist records when dryRun is true', async () => {
      creatorsRepo.findAll.mockResolvedValue({
        items: [{ creator: mockCreator as any, profile: null }],
        total: 1,
      });

      verificationsRepo.findLatestByCreatorId.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreator.id,
        status: 'VERIFIED',
      } as any);

      const result = await service.runMonthlySettlement({
        periodMonth: '2026-09-01',
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(earningsRepo.upsertSettlement).not.toHaveBeenCalled();
    });
  });

  describe('getCreatorEarnings & getCreatorEarningsSummary', () => {
    it('getCreatorEarnings should throw ForbiddenException if user is not creator', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);

      await expect(
        service.getCreatorEarnings('non_creator_user', { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('getCreatorEarnings should return paginated earnings', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      earningsRepo.findByCreatorId.mockResolvedValue({
        items: [
          {
            id: 'earn_1',
            creatorId: mockCreator.id,
            periodMonth: '2026-09-01',
            grossAmount: '15000.00',
            platformFee: '4500.00',
            taxWithheld: '1050.00',
            netPayout: '9450.00',
            currency: 'INR',
            status: 'PENDING_PAYOUT',
            holdReason: null,
            payoutReference: null,
            metadata: null,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      });

      const res = await service.getCreatorEarnings(mockCreator.userId, { page: 1, limit: 20 });
      expect(res.total).toBe(1);
      expect(res.items[0].netPayout).toBe('9450.00');
    });

    it('getCreatorEarningsSummary should return summary metrics', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      earningsRepo.getEarningsSummary.mockResolvedValue({
        totalGross: '50000.00',
        totalNet: '31500.00',
        totalPaid: '20000.00',
        pendingPayout: '11500.00',
        heldAmount: '0.00',
        currency: 'INR',
        lastSettlementMonth: '2026-09-01',
        lifetimePayoutsCount: 2,
      });

      const summary = await service.getCreatorEarningsSummary(mockCreator.userId);
      expect(summary.totalGross).toBe('50000.00');
      expect(summary.totalPaid).toBe('20000.00');
      expect(summary.pendingPayout).toBe('11500.00');
    });
  });

  describe('updateEarningsStatus (State Machine & Transitions)', () => {
    it('should throw NotFoundException if earning does not exist', async () => {
      earningsRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateEarningsStatus('non_existent', { status: 'PENDING_PAYOUT' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if record is already PAID', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'PAID',
      } as any);

      await expect(
        service.updateEarningsStatus('earn_1', { status: 'PENDING_PAYOUT' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transitioning to PAID from CALCULATED', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'CALCULATED',
      } as any);

      await expect(
        service.updateEarningsStatus('earn_1', {
          status: 'PAID',
          payoutReference: 'RZP_123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transitioning to PAID without payoutReference', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'PENDING_PAYOUT',
      } as any);

      await expect(
        service.updateEarningsStatus('earn_1', { status: 'PAID' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transitioning to HELD without holdReason', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'PENDING_PAYOUT',
      } as any);

      await expect(
        service.updateEarningsStatus('earn_1', { status: 'HELD' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully transition PENDING_PAYOUT to PAID with payoutReference', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'PENDING_PAYOUT',
      } as any);

      earningsRepo.updateStatus.mockResolvedValue({
        id: 'earn_1',
        creatorId: mockCreator.id,
        periodMonth: '2026-09-01',
        grossAmount: '10000.00',
        platformFee: '3000.00',
        taxWithheld: '700.00',
        netPayout: '6300.00',
        currency: 'INR',
        status: 'PAID',
        payoutReference: 'RZP_TRANS_999',
        holdReason: null,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.updateEarningsStatus(
        'earn_1',
        { status: 'PAID', payoutReference: 'RZP_TRANS_999' },
        'admin_1',
      );

      expect(result.status).toBe('PAID');
      expect(result.payoutReference).toBe('RZP_TRANS_999');
      expect(earningsRepo.updateStatus).toHaveBeenCalledWith(
        'earn_1',
        expect.objectContaining({
          status: 'PAID',
          payoutReference: 'RZP_TRANS_999',
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should successfully transition HELD to PENDING_PAYOUT and clear holdReason', async () => {
      earningsRepo.findById.mockResolvedValue({
        id: 'earn_1',
        status: 'HELD',
        holdReason: 'KYC missing',
      } as any);

      earningsRepo.updateStatus.mockResolvedValue({
        id: 'earn_1',
        creatorId: mockCreator.id,
        periodMonth: '2026-09-01',
        grossAmount: '10000.00',
        platformFee: '3000.00',
        taxWithheld: '700.00',
        netPayout: '6300.00',
        currency: 'INR',
        status: 'PENDING_PAYOUT',
        holdReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.updateEarningsStatus(
        'earn_1',
        { status: 'PENDING_PAYOUT' },
        'admin_1',
      );

      expect(result.status).toBe('PENDING_PAYOUT');
      expect(earningsRepo.updateStatus).toHaveBeenCalledWith(
        'earn_1',
        expect.objectContaining({
          status: 'PENDING_PAYOUT',
          holdReason: null,
        }),
      );
    });
  });
});
