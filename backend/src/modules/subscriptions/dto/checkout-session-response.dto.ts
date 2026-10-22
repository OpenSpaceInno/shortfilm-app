import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, BillingInterval, SubscriptionStatus } from '../../../database/schema';

export class CheckoutSessionResponseDto {
  @ApiProperty({ description: 'Hosted checkout URL or client redirect URL' })
  checkoutUrl: string;

  @ApiProperty({ description: 'Payment gateway session identifier' })
  sessionId: string;

  @ApiPropertyOptional({ description: 'External order ID (e.g. Razorpay order_id)' })
  orderId?: string;

  @ApiProperty({ description: 'Payment provider used', enum: ['MANUAL', 'RAZORPAY', 'STRIPE'] })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Created subscription record ULID' })
  subscriptionId: string;

  @ApiProperty({ description: 'Subscription status (TRIAL or ACTIVE if instant mock/trial, PENDING if awaiting payment)', enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'] })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Purchased plan name' })
  planName: string;

  @ApiProperty({ description: 'Amount billed in base currency' })
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Billing interval', enum: ['MONTHLY', 'ANNUAL', 'LIFETIME', 'FREE'] })
  billingInterval: BillingInterval;

  @ApiPropertyOptional({ description: 'Provider specific client metadata for SDK checkout initialization' })
  metadata?: Record<string, unknown>;
}
