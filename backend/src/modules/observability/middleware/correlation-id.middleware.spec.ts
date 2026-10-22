import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { CorrelationContextService } from '../services/correlation-context.service';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let contextService: CorrelationContextService;

  beforeEach(() => {
    contextService = new CorrelationContextService();
    middleware = new CorrelationIdMiddleware(contextService);
  });

  it('should use existing X-Correlation-Id header if provided', (done) => {
    const req: any = {
      headers: {
        'x-correlation-id': 'req_custom_header_id',
      },
    };
    const res: any = {
      setHeader: jest.fn(),
    };

    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'req_custom_header_id');
      expect(contextService.getCorrelationId()).toBe('req_custom_header_id');
      done();
    });
  });

  it('should fall back to cf-ray or generate a unique ULID if no correlation ID provided', (done) => {
    const req: any = {
      headers: {
        'cf-ray': 'cf-ray-8e12345678',
      },
      ip: '10.0.0.1',
    };
    const res: any = {
      setHeader: jest.fn(),
    };

    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'cf-ray-8e12345678');
      expect(contextService.getCorrelationId()).toBe('cf-ray-8e12345678');
      expect(contextService.getClientIp()).toBe('10.0.0.1');
      done();
    });
  });

  it('should generate a new ULID request ID when no header is present', (done) => {
    const req: any = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res: any = {
      setHeader: jest.fn(),
    };

    middleware.use(req, res, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', expect.stringMatching(/^req_[0-9A-Z]{26}$/));
      expect(contextService.getCorrelationId()).toMatch(/^req_[0-9A-Z]{26}$/);
      done();
    });
  });
});
