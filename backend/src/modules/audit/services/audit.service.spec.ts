import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';

describe('AuditService (M29)', () => {
  let service: AuditService;
  let repo: jest.Mocked<AuditLogsRepository>;

  const mockDate = new Date('2026-10-12T12:00:00.000Z');

  const mockRecord = {
    id: 'audit_01H1234567890ABCDEF',
    actorId: 'usr_admin1',
    actorRole: 'SUPER_ADMIN',
    action: 'SETTING_UPDATED',
    entityType: 'SYSTEM_SETTING',
    entityId: 'transcode_target_resolutions',
    previousState: { value: ['720p'] },
    newState: { value: ['720p', '1080p'] },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    requestId: 'req_12345',
    createdAt: mockDate,
  };

  beforeEach(async () => {
    const mockRepo = {
      log: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      exportLogs: jest.fn(),
      countTotal: jest.fn(),
      countOlderThan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: AuditLogsRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(AuditLogsRepository);
  });

  describe('log', () => {
    it('should create an immutable audit log and return DTO', async () => {
      repo.log.mockResolvedValue(mockRecord as any);

      const result = await service.log({
        actor: { id: 'usr_admin1', roles: ['SUPER_ADMIN'] },
        action: 'SETTING_UPDATED',
        entityType: 'SYSTEM_SETTING',
        entityId: 'transcode_target_resolutions',
        previousState: { value: ['720p'] },
        newState: { value: ['720p', '1080p'] },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req_12345',
      });

      expect(repo.log).toHaveBeenCalledWith({
        actorId: 'usr_admin1',
        actorRole: 'SUPER_ADMIN',
        action: 'SETTING_UPDATED',
        entityType: 'SYSTEM_SETTING',
        entityId: 'transcode_target_resolutions',
        previousState: { value: ['720p'] },
        newState: { value: ['720p', '1080p'] },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req_12345',
      });

      expect(result).toEqual({
        id: mockRecord.id,
        actorId: mockRecord.actorId,
        actorRole: mockRecord.actorRole,
        action: mockRecord.action,
        entityType: mockRecord.entityType,
        entityId: mockRecord.entityId,
        previousState: mockRecord.previousState,
        newState: mockRecord.newState,
        ipAddress: mockRecord.ipAddress,
        userAgent: mockRecord.userAgent,
        requestId: mockRecord.requestId,
        createdAt: mockDate.toISOString(),
      });
    });

    it('should fallback to SUPER_ADMIN role if actor has no roles provided', async () => {
      repo.log.mockResolvedValue(mockRecord as any);

      await service.log({
        actor: { id: 'usr_unknown' },
        action: 'SUSPEND_USER',
        entityType: 'USER',
      });

      expect(repo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorRole: 'SUPER_ADMIN',
        }),
      );
    });
  });

  describe('getAuditTrail', () => {
    it('should query logs with pagination and compute totalPages', async () => {
      repo.findMany.mockResolvedValue({
        items: [mockRecord as any],
        total: 25,
      });

      const result = await service.getAuditTrail({ page: 2, limit: 10 });

      expect(repo.findMany).toHaveBeenCalledWith({ page: 2, limit: 10 });
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.items[0]?.createdAt).toBe(mockDate.toISOString());
    });
  });

  describe('getAuditLogById', () => {
    it('should return log if found', async () => {
      repo.findById.mockResolvedValue(mockRecord as any);

      const result = await service.getAuditLogById('audit_01H1234567890ABCDEF');
      expect(result.id).toBe('audit_01H1234567890ABCDEF');
    });

    it('should throw NotFoundException if log is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getAuditLogById('non_existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportAuditTrail', () => {
    it('should export audit trail as JSON format', async () => {
      repo.exportLogs.mockResolvedValue([mockRecord as any]);

      const result = await service.exportAuditTrail({ format: 'json' });

      expect(result.contentType).toBe('application/json');
      expect(result.filename).toContain('audit-trail-');
      expect(result.filename).toContain('.json');
      const parsed = JSON.parse(result.data);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].action).toBe('SETTING_UPDATED');
    });

    it('should export audit trail as RFC 4180 CSV format', async () => {
      repo.exportLogs.mockResolvedValue([mockRecord as any]);

      const result = await service.exportAuditTrail({ format: 'csv' });

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
      expect(result.data).toContain('id,createdAt,actorId,actorRole,action,entityType,entityId,ipAddress,requestId');
      expect(result.data).toContain('SETTING_UPDATED');
    });
  });

  describe('getAuditRetentionMetrics', () => {
    it('should return total logs count and older than one year count', async () => {
      repo.countTotal.mockResolvedValue(1000);
      repo.countOlderThan.mockResolvedValue(200);

      const result = await service.getAuditRetentionMetrics();
      expect(result.totalLogs).toBe(1000);
      expect(result.olderThanOneYear).toBe(200);
      expect(repo.countOlderThan).toHaveBeenCalledWith(expect.any(Date));
    });
  });
});
