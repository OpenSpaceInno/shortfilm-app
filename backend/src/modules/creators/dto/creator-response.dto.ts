import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatorTier, CreatorStatus } from '../../../database/schema';

export class CreatorProfileDto {
  @ApiPropertyOptional({ description: 'Short catchphrase tagline' })
  tagline?: string | null;

  @ApiPropertyOptional({ description: 'Detailed creative biography' })
  bio?: string | null;

  @ApiPropertyOptional({ description: 'Avatar thumbnail image URL' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'Profile banner cover image URL' })
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Operating base location (e.g. Mumbai, Jaipur)' })
  location?: string | null;

  @ApiPropertyOptional({ description: 'Primary creative focus category' })
  category?: string | null;

  @ApiPropertyOptional({ description: 'Genre specialties', type: [String] })
  genres?: string[] | null;

  @ApiPropertyOptional({ description: 'Production languages', type: [String] })
  languages?: string[] | null;

  @ApiPropertyOptional({ description: 'Creative background & past credits' })
  experience?: string | null;

  @ApiPropertyOptional({ description: 'External portfolio website' })
  portfolioUrl?: string | null;

  @ApiPropertyOptional({ description: 'Official creator website' })
  websiteUrl?: string | null;

  @ApiPropertyOptional({ description: 'Social media profile handles & links' })
  socialLinks?: Record<string, string> | null;

  @ApiProperty({ description: 'Whether featured on home page & editorial rails' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Whether marked as rising breakout creator' })
  isRising: boolean;
}

export class CreatorResponseDto {
  @ApiProperty({ description: 'Creator ULID' })
  id: string;

  @ApiProperty({ description: 'Associated User account ULID' })
  userId: string;

  @ApiProperty({ description: 'Display name / studio brand name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Brief bio snippet' })
  bio?: string | null;

  @ApiProperty({ description: 'Creator tier level: EMERGING, VERIFIED, EXCLUSIVE, PARTNER', enum: ['EMERGING', 'VERIFIED', 'EXCLUSIVE', 'PARTNER'] })
  tier: CreatorTier;

  @ApiProperty({ description: 'Lifecycle status: APPLIED, UNDER_REVIEW, APPROVED, VERIFIED, ACTIVE, SUSPENDED, REJECTED, DEACTIVATED' })
  status: CreatorStatus;

  @ApiPropertyOptional({ description: 'Verification timestamp if verified', nullable: true })
  verifiedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Suspension reason if suspended', nullable: true })
  suspensionReason?: string | null;

  @ApiPropertyOptional({ description: 'Suspension timestamp if suspended', nullable: true })
  suspensionDate?: Date | null;

  @ApiPropertyOptional({ description: 'Extended creator branding profile', type: CreatorProfileDto })
  profile?: CreatorProfileDto | null;

  @ApiPropertyOptional({ description: 'Follower audience tally' })
  followersCount?: number;

  @ApiPropertyOptional({ description: 'Total published/managed stories' })
  storiesCount?: number;

  @ApiProperty({ description: 'Joined timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last profile update timestamp' })
  updatedAt: Date;
}

export class PaginatedCreatorsDto {
  @ApiProperty({ description: 'List of creators', type: [CreatorResponseDto] })
  items: CreatorResponseDto[];

  @ApiProperty({ description: 'Total matching creators count' })
  total: number;

  @ApiProperty({ description: 'Whether more pages exist' })
  hasMore: boolean;
}
