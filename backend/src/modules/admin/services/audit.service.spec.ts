import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';

describe('AuditService', () => {
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
    it('should query logs with pagination and map dates to ISO strings', async () => {
      repo.findMany.mockResolvedValue({
        items: [mockRecord as any],
        total: 1,
      });

      const result = await service.getAuditTrail({ page: 1, limit: 10 });

      expect(repo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
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
});
