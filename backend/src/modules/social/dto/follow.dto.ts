import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowDto {
  @ApiProperty({ description: 'Target entity type to follow', enum: ['CREATOR', 'CHARACTER', 'STORY'] })
  @IsIn(['CREATOR', 'CHARACTER', 'STORY'])
  targetType: 'CREATOR' | 'CHARACTER' | 'STORY';

  @ApiProperty({ description: 'Target entity ULID' })
  @IsString()
  @IsNotEmpty()
  targetId: string;
}

export class FollowResponseDto {
  @ApiProperty({ description: 'Follow record ULID' })
  id: string;

  @ApiProperty({ description: 'User ID of follower' })
  userId: string;

  @ApiProperty({ description: 'Target type: CREATOR, CHARACTER, STORY' })
  targetType: string;

  @ApiProperty({ description: 'Target ID followed' })
  targetId: string;

  @ApiProperty({ description: 'XP points awarded on follow action' })
  xpAwarded: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class FollowStatusDto {
  @ApiProperty({ description: 'Whether the current authenticated user follows this target' })
  isFollowing: boolean;

  @ApiProperty({ description: 'Total followers count for target' })
  followerCount: number;
}
