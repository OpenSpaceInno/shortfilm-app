import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from '../services/metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = {
      recordHttpRequest: jest.fn(),
    } as any;
    interceptor = new MetricsInterceptor(metricsService);
  });

  it('should normalize routes containing ULIDs or UUIDs', () => {
    const rawPath = '/api/v1/stories/01J8ABCDEF1234567890ABCDEF/episodes';
    const normalized = interceptor.normalizeRoute(rawPath);
    expect(normalized).toBe('/api/v1/stories/:id/episodes');
  });

  it('should intercept successful request and record duration into Prometheus', (done) => {
    const mockRequest: any = {
      method: 'GET',
      path: '/api/v1/stories/01J8ABCDEF1234567890ABCDEF',
    };
    const mockResponse: any = {
      statusCode: 200,
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    const mockHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
          'GET',
          '/api/v1/stories/:id',
          200,
          expect.any(Number),
        );
        done();
      },
    });
  });

  it('should intercept failed request and record error status', (done) => {
    const mockRequest: any = {
      method: 'POST',
      path: '/api/v1/interactive/choices',
    };
    const mockResponse: any = {
      statusCode: 500,
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    const mockHandler: CallHandler = {
      handle: () => throwError(() => ({ status: 404, message: 'Node not found' })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: () => {
        expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
          'POST',
          '/api/v1/interactive/choices',
          404,
          expect.any(Number),
        );
        done();
      },
    });
  });
});
