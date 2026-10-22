import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { TracingInterceptor } from './tracing.interceptor';
import { TracingService } from '../services/tracing.service';

describe('TracingInterceptor', () => {
  let interceptor: TracingInterceptor;
  let tracingService: TracingService;
  let reflector: Reflector;
  let mockSpan: any;

  beforeEach(() => {
    mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    };

    tracingService = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
    } as any;

    reflector = new Reflector();
    interceptor = new TracingInterceptor(tracingService, reflector);
  });

  it('should start span and set HTTP attributes on success', (done) => {
    const mockRequest: any = {
      method: 'GET',
      url: '/api/v1/health/liveness',
      headers: { 'user-agent': 'HealthCheck/1.0' },
      route: { path: '/health/liveness' },
    };
    const mockResponse: any = {
      statusCode: 200,
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => () => {},
      getClass: () => ({ name: 'HealthController' }),
    } as any;

    const mockHandler: CallHandler = {
      handle: () => of({ status: 'ok' }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(tracingService.startSpan).toHaveBeenCalledWith('GET /health/liveness');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('http.method', 'GET');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('http.status_code', 200);
        expect(mockSpan.end).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should mark span as error and record exception on handler rejection', (done) => {
    const mockRequest: any = {
      method: 'POST',
      url: '/api/v1/stories',
      headers: {},
      path: '/stories',
    };
    const mockResponse: any = {
      statusCode: 500,
    };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => () => {},
      getClass: () => ({ name: 'StoriesController' }),
    } as any;

    const mockHandler: CallHandler = {
      handle: () => throwError(() => new Error('Validation failed')),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: () => {
        expect(mockSpan.recordException).toHaveBeenCalled();
        expect(mockSpan.end).toHaveBeenCalled();
        done();
      },
    });
  });
});
