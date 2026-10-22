import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from '../services/audit.service';

describe('AuditController (M29)', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  const mockLog = {
    id: 'log_01',
    actorId: 'usr_admin',
    actorRole: 'SUPER_ADMIN',
    action: 'USER_SUSPENDED',
    entityType: 'USER',
    entityId: 'usr_target',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockService = {
      getAuditTrail: jest.fn(),
      getAuditLogById: jest.fn(),
      exportAuditTrail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  describe('getAuditTrail', () => {
    it('should return paginated audit trail wrapped in ApiResponseDto', async () => {
      service.getAuditTrail.mockResolvedValue({
        items: [mockLog as any],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await controller.getAuditTrail({ page: 1, limit: 20 });
      expect(res.data).toHaveLength(1);
      expect(res.meta?.total).toBe(1);
      expect(res.meta?.page).toBe(1);
      expect(service.getAuditTrail).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('getAuditLogById', () => {
    it('should return single audit record', async () => {
      service.getAuditLogById.mockResolvedValue(mockLog as any);

      const res = await controller.getAuditLogById('log_01');
      expect(res.data.id).toBe('log_01');
      expect(service.getAuditLogById).toHaveBeenCalledWith('log_01');
    });
  });

  describe('exportAuditTrail', () => {
    it('should set headers and stream CSV export', async () => {
      service.exportAuditTrail.mockResolvedValue({
        data: 'id,action\nlog_01,USER_SUSPENDED',
        contentType: 'text/csv',
        filename: 'audit-trail-2026.csv',
      });

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.exportAuditTrail({ format: 'csv' }, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="audit-trail-2026.csv"',
      );
      expect(mockRes.send).toHaveBeenCalledWith('id,action\nlog_01,USER_SUSPENDED');
    });
  });
});
