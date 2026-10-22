import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditLoggingInterceptor } from './audit-logging.interceptor';
import { AuditService } from '../services/audit.service';
import { AUDITED_ACTION_KEY } from '../decorators/audited-action.decorator';

describe('AuditLoggingInterceptor (M29)', () => {
  let interceptor: AuditLoggingInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'usr_admin',
    roles: ['SUPER_ADMIN'],
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({} as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggingInterceptor,
        { provide: Reflector, useValue: mockReflector },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    interceptor = module.get<AuditLoggingInterceptor>(AuditLoggingInterceptor);
    reflector = module.get(Reflector);
    auditService = module.get(AuditService);
  });

  it('should passthrough if no AUDITED_ACTION metadata is present', (done) => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    const mockHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((res) => {
      expect(res).toEqual({ success: true });
      expect(auditService.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('should passthrough if user is not authenticated', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'TEST_ACTION',
      entityType: 'TEST_ENTITY',
    });

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as any;

    const mockHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((res) => {
      expect(res).toEqual({ success: true });
      expect(auditService.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('should capture metadata, actor, and payload to write an audit log', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'STORY_ARCHIVED',
      entityType: 'STORY',
    });

    const mockReq = {
      user: mockUser,
      params: { id: 'story_123' },
      body: { reason: 'Violates content standards', password: 'secret_to_redact' },
      headers: {
        'x-request-id': 'req_abc123',
        'x-forwarded-for': '198.51.100.25',
        'user-agent': 'Chrome/120',
      },
    };

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockReq),
      }),
    } as any;

    const mockHandler = {
      handle: jest.fn().mockReturnValue(of({ data: { id: 'story_123', status: 'ARCHIVED' } })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((res) => {
      expect(res.data.status).toBe('ARCHIVED');
      setImmediate(() => {
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            actor: mockUser,
            action: 'STORY_ARCHIVED',
            entityType: 'STORY',
            entityId: 'story_123',
            requestId: 'req_abc123',
            ipAddress: '198.51.100.25',
            userAgent: 'Chrome/120',
            newState: expect.objectContaining({
              reason: 'Violates content standards',
            }),
          }),
        );
        // Verify sensitive fields like password are redacted
        const callArgs = auditService.log.mock.calls[0]![0];
        expect(callArgs.newState?.password).toBeUndefined();
        done();
      });
    });
  });
});
