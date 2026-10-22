import { Test, TestingModule } from '@nestjs/testing';
import { GdprComplianceController } from './gdpr-compliance.controller';
import { GdprComplianceService } from '../services/gdpr-compliance.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('GdprComplianceController (M29)', () => {
  let controller: GdprComplianceController;
  let service: jest.Mocked<GdprComplianceService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Super Admin',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'JestAuditRunner',
      'x-request-id': 'req_gdpr_01',
    },
  } as any;

  beforeEach(async () => {
    const mockService = {
      anonymizeUser: jest.fn(),
      exportUserData: jest.fn(),
      listGdprRequests: jest.fn(),
      getRetentionStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GdprComplianceController],
      providers: [{ provide: GdprComplianceService, useValue: mockService }],
    }).compile();

    controller = module.get<GdprComplianceController>(GdprComplianceController);
    service = module.get(GdprComplianceService);
  });

  describe('anonymizeUser', () => {
    it('should invoke service and return ApiResponseDto with anonymized result', async () => {
      service.anonymizeUser.mockResolvedValue({
        success: true,
        userId: 'usr_target',
        anonymizedEmail: 'anon_123@anonymized.shortreel.local',
        message: 'User PII successfully anonymized',
      });

      const res = await controller.anonymizeUser(
        'usr_target',
        { reason: 'Right to erasure', confirmed: true },
        mockAdminUser,
        mockRequest,
      );

      expect(res.data.success).toBe(true);
      expect(res.data.anonymizedEmail).toBe('anon_123@anonymized.shortreel.local');
      expect(service.anonymizeUser).toHaveBeenCalledWith(
        'usr_target',
        { reason: 'Right to erasure', confirmed: true },
        mockAdminUser,
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
    });
  });

  describe('exportUserData', () => {
    it('should invoke service and return SAR export payload', async () => {
      const mockExport = {
        userId: 'usr_target',
        exportedAt: new Date().toISOString(),
        profile: { id: 'usr_target', email: 'test@example.com' } as any,
        historyStats: { totalChoicesMade: 10, totalWatchHistoryRecords: 0, totalReviewsWritten: 0 },
      };

      service.exportUserData.mockResolvedValue(mockExport);

      const res = await controller.exportUserData('usr_target', mockAdminUser, mockRequest);
      expect(res.data.userId).toBe('usr_target');
      expect(res.data.historyStats.totalChoicesMade).toBe(10);
      expect(service.exportUserData).toHaveBeenCalledWith(
        'usr_target',
        mockAdminUser,
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
    });
  });

  describe('listGdprRequests', () => {
    it('should return paginated requests list', async () => {
      service.listGdprRequests.mockResolvedValue({
        items: [{ id: 'req_1', requestType: 'ERASURE', status: 'COMPLETED' } as any],
        total: 1,
      });

      const res = await controller.listGdprRequests({ page: 1, limit: 20 });
      expect(res.data).toHaveLength(1);
      expect(res.meta?.total).toBe(1);
      expect(service.listGdprRequests).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('getRetentionStatus', () => {
    it('should return compliance retention status report', async () => {
      const mockStatus = {
        evaluatedAt: new Date().toISOString(),
        entities: [
          {
            entity: 'audit_logs',
            policy: '7 Years compliance',
            retentionWindowDays: 365,
            totalRecords: 100,
            recordsEligibleForPurge: 10,
          },
        ],
      };

      service.getRetentionStatus.mockResolvedValue(mockStatus);

      const res = await controller.getRetentionStatus();
      expect(res.data.entities).toHaveLength(1);
      expect(service.getRetentionStatus).toHaveBeenCalled();
    });
  });
});
