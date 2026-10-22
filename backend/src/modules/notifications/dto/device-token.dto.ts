import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM / APNs push notification token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Client platform: WEB, ANDROID, or IOS', enum: ['WEB', 'ANDROID', 'IOS'] })
  @IsIn(['WEB', 'ANDROID', 'IOS'])
  platform: 'WEB' | 'ANDROID' | 'IOS';
}
