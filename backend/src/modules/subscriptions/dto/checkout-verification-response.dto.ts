import { ApiProperty } from '@nestjs/swagger';
import { CurrentSubscriptionResponseDto } from './current-subscription-response.dto';

export class CheckoutVerificationResponseDto {
  @ApiProperty({ description: 'Whether the checkout and entitlement provisioning succeeded', example: true })
  success: boolean;

  @ApiProperty({ description: 'Confirmation status message' })
  message: string;

  @ApiProperty({ description: 'Updated active subscription profile', type: CurrentSubscriptionResponseDto })
  subscription: CurrentSubscriptionResponseDto;
}
