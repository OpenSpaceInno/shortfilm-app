import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GdprComplianceService } from './gdpr-compliance.service';
import { GdprRequestsRepository } from '../repositories/gdpr-requests.repository';
import { AuditService } from './audit.service';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('GdprComplianceService (M29)', () => {
  let service: GdprComplianceService;
  let gdprRepo: jest.Mocked<GdprRequestsRepository>;
  let auditService: jest.Mocked<AuditService>;
  let mockDb: any;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin_01',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Super Admin',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockTargetUser = {
    id: 'user_target_01',
    externalSubjectId: 'auth0|target',
    externalAuthProvider: 'AUTH0',
    email: 'target@example.com',
    displayName: 'John Doe',
    phone: '+1234567890',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    lastLoginAt: new Date('2026-10-01T00:00:00Z'),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const mockDbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const mockGdprRepo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findMany: jest.fn(),
      countPending: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
      getAuditRetentionMetrics: jest.fn().mockResolvedValue({ totalLogs: 500, olderThanOneYear: 50 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprComplianceService,
        { provide: DRIZZLE_DB, useValue: mockDbService },
        { provide: GdprRequestsRepository, useValue: mockGdprRepo },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<GdprComplianceService>(GdprComplianceService);
    gdprRepo = module.get(GdprRequestsRepository);
    auditService = module.get(AuditService);
  });

  describe('anonymizeUser', () => {
    it('should throw BadRequestException if confirmed flag is false', async () => {
      await expect(
        service.anonymizeUser(
          'user_target_01',
          { reason: 'User requested deletion', confirmed: false },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if admin attempts self-erasure', async () => {
      await expect(
        service.anonymizeUser(
          'user_admin_01',
          { reason: 'Accidental self-delete', confirmed: true },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(
        service.anonymizeUser(
          'missing_user',
          { reason: 'Non-existent', confirmed: true },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already deleted', async () => {
      mockDb.limit.mockResolvedValue([{ ...mockTargetUser, status: 'DELETED' }]);

      await expect(
        service.anonymizeUser(
          'user_target_01',
          { reason: 'Already deleted', confirmed: true },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should scrub PII, record GDPR request, and write audit log', async () => {
      mockDb.limit.mockResolvedValue([mockTargetUser]);
      gdprRepo.create.mockResolvedValue({ id: 'req_01' } as any);
      gdprRepo.update.mockResolvedValue({ id: 'req_01' } as any);

      const result = await service.anonymizeUser(
        'user_target_01',
        { reason: 'User exercised Right to Erasure', confirmed: true, immediate: true },
        mockAdminUser,
        { ipAddress: '127.0.0.1' },
      );

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
      expect(gdprRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_target_01',
          requestType: 'ERASURE',
          status: 'COMPLETED',
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'GDPR_USER_ANONYMIZED',
          entityType: 'USER',
          entityId: 'user_target_01',
        }),
      );
      expect(result.success).toBe(true);
      expect(result.anonymizedEmail).toContain('anon_');
      expect(result.anonymizedEmail).toContain('@anonymized.shortreel.local');
    });
  });

  describe('exportUserData', () => {
    it('should compile SAR payload, record request, and log audit event', async () => {
      mockDb.limit
        .mockResolvedValueOnce([mockTargetUser]) // users query
        .mockResolvedValueOnce([{ bio: 'Film buff', languagePreference: 'en' }]) // userProfiles query
        .mockResolvedValueOnce([{ id: 'c1', displayName: 'Creator John', tier: 'PRO', status: 'VERIFIED' }]); // creators query

      mockDb.where
        .mockReturnValueOnce(mockDb) // limit follows
        .mockReturnValueOnce(mockDb) // limit follows
        .mockReturnValueOnce(mockDb) // limit follows
        .mockResolvedValueOnce([{ id: 'sub_1', status: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodStart: new Date(), currentPeriodEnd: new Date() }]) // subscriptions
        .mockResolvedValueOnce([{ count: 42 }]); // choices count

      gdprRepo.create.mockResolvedValue({ id: 'exp_req_01' } as any);

      const result = await service.exportUserData('user_target_01', mockAdminUser);

      expect(result.userId).toBe('user_target_01');
      expect(result.profile.email).toBe('target@example.com');
      expect(result.preferences?.bio).toBe('Film buff');
      expect(result.creatorProfile?.displayName).toBe('Creator John');
      expect(result.historyStats.totalChoicesMade).toBe(42);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'GDPR_DATA_EXPORTED',
          entityType: 'USER',
          entityId: 'user_target_01',
        }),
      );
    });
  });

  describe('anonymizeIp', () => {
    it('should mask the last octet for IPv4', () => {
      expect(service.anonymizeIp('192.168.1.123')).toBe('192.168.1.0');
      expect(service.anonymizeIp('10.0.50.99')).toBe('10.0.50.0');
    });

    it('should mask interface ID for IPv6', () => {
      const masked = service.anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(masked).toBe('2001:0db8:85a3::0');
    });

    it('should handle comma-separated forwarded IPs by using the first client IP', () => {
      expect(service.anonymizeIp('203.0.113.195, 70.41.3.18')).toBe('203.0.113.0');
    });

    it('should fallback to 0.0.0.0 for empty or invalid IPs', () => {
      expect(service.anonymizeIp('')).toBe('0.0.0.0');
      expect(service.anonymizeIp('invalid-ip')).toBe('0.0.0.0');
    });
  });

  describe('listGdprRequests', () => {
    it('should delegate to gdprRepo.findMany', async () => {
      gdprRepo.findMany.mockResolvedValue({ items: [{ id: 'req_1' } as any], total: 1 });

      const res = await service.listGdprRequests({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(gdprRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getRetentionStatus', () => {
    it('should evaluate audit logs, notifications, and analytics retention schedules', async () => {
      mockDb.from
        .mockReturnValueOnce(mockDb) // notifications sweep
        .mockReturnValueOnce(mockDb); // notifications total

      mockDb.where.mockResolvedValueOnce([{ count: 15 }]); // read notifications eligible
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockResolvedValueOnce([{ count: 150 }]); // total notifications

      const status = await service.getRetentionStatus();

      expect(status.entities).toHaveLength(3);
      expect(status.entities[0]?.entity).toBe('audit_logs');
      expect(status.entities[0]?.retentionWindowDays).toBe(365);
      expect(status.entities[0]?.recordsEligibleForPurge).toBe(50);
      expect(status.entities[1]?.entity).toContain('notifications');
    });
  });
});
