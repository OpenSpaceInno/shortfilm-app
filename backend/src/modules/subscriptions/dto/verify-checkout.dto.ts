import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProviderEnum, PaymentProvider } from '../../../database/schema';

export class VerifyCheckoutDto {
  @ApiProperty({ description: 'ShortReel subscription ULID identifier' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiPropertyOptional({ description: 'Payment gateway provider', enum: [...PaymentProviderEnum, 'MOCK'], default: 'RAZORPAY' })
  @IsOptional()
  @IsIn([...PaymentProviderEnum, 'MOCK'])
  provider?: any = 'RAZORPAY';

  @ApiPropertyOptional({ description: 'Gateway transaction or payment ID (e.g. pay_29QQoUBi66xm2f)' })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({ description: 'Gateway order ID (e.g. order_9A33XWu170gUtm)' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Cryptographic signature from gateway webhook/callback' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Stripe or mock checkout session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
