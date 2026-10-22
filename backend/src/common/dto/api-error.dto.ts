import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDetailDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Machine-readable error code' })
  code: string;

  @ApiProperty({ example: 'The provided email is already registered.', description: 'Human-readable error message' })
  message: string;

  @ApiProperty({ example: 'req_01HVG7...', description: 'Unique trace identifier for this request' })
  requestId: string;

  @ApiProperty({ required: false, example: [{ field: 'email', message: 'must be an email' }], description: 'Granular error details' })
  details?: unknown;

  @ApiProperty({ example: '2026-09-29T11:45:00.000Z', description: 'Timestamp of the error' })
  timestamp: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Always false on error' })
  success: boolean;

  @ApiProperty({ type: ApiErrorDetailDto, description: 'Error payload' })
  error: ApiErrorDetailDto;

  constructor(code: string, message: string, requestId: string, details?: unknown) {
    this.success = false;
    this.error = {
      code,
      message,
      requestId,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}
