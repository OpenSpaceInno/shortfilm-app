import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiPropertyOptional({ example: 'Filmmaker and interactive story enthusiast.' })
  bio: string | null;

  @ApiProperty({ example: 'en' })
  languagePreference: string;

  @ApiPropertyOptional({ example: ['thriller', 'mystery'] })
  genrePreferences: string[] | null;

  @ApiPropertyOptional({ example: { newEpisodes: true } })
  notificationPreferences: Record<string, boolean> | null;
}

export class UserResponseDto {
  @ApiProperty({ example: '01HVG7J0000000000000000001', description: 'Base32 ULID identifier' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://images.shortreel.io/avatars/u1.jpg' })
  avatarUrl: string | null;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'SUSPENDED', 'DELETED'] })
  status: string;

  @ApiProperty({ example: ['USER'], description: 'Assigned platform roles' })
  roles: string[];

  @ApiPropertyOptional({ type: UserProfileResponseDto })
  profile?: UserProfileResponseDto;

  @ApiProperty({ example: '2026-09-29T11:45:00.000Z' })
  createdAt: string;
}
