import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already an instance of ApiResponseDto or already has success property, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Support returning { data, meta } from service layer
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          const { data: innerData, meta } = data as { data: T; meta: Record<string, unknown> };
          return new ApiResponseDto(innerData, meta);
        }

        return new ApiResponseDto(data);
      }),
    );
  }
}
