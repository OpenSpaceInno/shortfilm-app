import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto } from '../dto/api-error.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      `req_${Date.now()}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred. Please try again later.';
    let errorDetails: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
        errorCode = exception.name.toUpperCase();
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        errorMessage = (resObj['message'] as string) || exception.message;
        errorCode = (resObj['error'] as string) || exception.name.toUpperCase();
        errorDetails = resObj['details'] || (Array.isArray(resObj['message']) ? resObj['message'] : undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      // In production, do not leak raw internal error messages
      if (process.env.NODE_ENV !== 'production') {
        errorMessage = exception.message;
      }
    }

    const payload = new ApiErrorResponseDto(errorCode, errorMessage, requestId, errorDetails);

    response.status(status).json(payload);
  }
}
