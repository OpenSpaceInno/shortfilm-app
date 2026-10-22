import { IsString, IsNotEmpty, IsOptional, IsIn, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingIntervalEnum, PaymentProviderEnum, BillingInterval, PaymentProvider } from '../../../database/schema';

export class InitiateCheckoutDto {
  @ApiProperty({ description: 'ULID of the subscription plan to purchase', example: '01HQTESTPLAN00000000000002' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    description: 'Billing recurrence interval (MONTHLY or ANNUAL)',
    enum: ['MONTHLY', 'ANNUAL'],
    default: 'MONTHLY',
  })
  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingInterval?: 'MONTHLY' | 'ANNUAL';

  @ApiPropertyOptional({
    description: 'Payment gateway provider',
    enum: [...PaymentProviderEnum, 'MOCK'],
    default: 'RAZORPAY',
  })
  @IsOptional()
  @IsIn([...PaymentProviderEnum, 'MOCK'])
  provider?: any = 'RAZORPAY';

  @ApiPropertyOptional({
    description: 'Client return URL to redirect after checkout completion',
    example: 'http://localhost:8081/plans',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'Unique client idempotency key to prevent double billing',
    example: 'idem_9a7d8c1e-3b2a-4c5d-6e7f-8a9b0c1d2e3f',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
