import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates whether the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Payload returned by the endpoint' })
  data: T;

  @ApiProperty({ required: false, example: { page: 1, limit: 20, total: 100 }, description: 'Pagination or auxiliary metadata' })
  meta?: Record<string, unknown>;

  constructor(data: T, meta?: Record<string, unknown>) {
    this.success = true;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}
