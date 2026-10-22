import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../../../database/schema';

export class SubmitCreatorApplicationDto {
  @ApiProperty({ description: 'Full legal / applicant contact name' })
  @IsString()
  @IsNotEmpty()
  applicantName: string;

  @ApiProperty({ description: 'Proposed creator / studio brand name' })
  @IsString()
  @IsNotEmpty()
  creatorName: string;

  @ApiProperty({ description: 'Primary creative genre / category (Drama, Thriller, Romance, Sci-Fi, etc.)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Genre specialties', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ description: 'Languages of content creation', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Creator bio and artistic background' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'City/Region of production' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Past directing, writing, or video production experience' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ description: 'Link to portfolio / past work showreel' })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional({ description: 'Proposed debut interactive series pitch (title, concept, format)' })
  @IsOptional()
  @IsObject()
  proposedStory?: Record<string, any>;
}

export class ReviewCreatorApplicationDto {
  @ApiProperty({ description: 'Review action decision', enum: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'UNDER_REVIEW'] })
  @IsIn(['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'UNDER_REVIEW'])
  action: 'APPROVE' | 'REJECT' | 'CHANGES_REQUESTED' | 'UNDER_REVIEW';

  @ApiPropertyOptional({ description: 'Internal or user-facing feedback commentary' })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class CreatorApplicationResponseDto {
  @ApiProperty({ description: 'Application ULID' })
  id: string;

  @ApiProperty({ description: 'Applicant User ULID' })
  userId: string;

  @ApiProperty({ description: 'Contact Name' })
  applicantName: string;

  @ApiProperty({ description: 'Brand Name' })
  creatorName: string;

  @ApiProperty({ description: 'Category' })
  category: string;

  @ApiProperty({ description: 'Genres', type: [String] })
  genres: string[];

  @ApiProperty({ description: 'Languages', type: [String] })
  languages: string[];

  @ApiPropertyOptional({ description: 'Bio' })
  bio?: string | null;

  @ApiPropertyOptional({ description: 'Location' })
  location?: string | null;

  @ApiPropertyOptional({ description: 'Experience credits' })
  experience?: string | null;

  @ApiPropertyOptional({ description: 'Portfolio Link' })
  portfolioUrl?: string | null;

  @ApiPropertyOptional({ description: 'Pitch concept' })
  proposedStory?: Record<string, any> | null;

  @ApiProperty({ description: 'Current application status: PENDING, UNDER_REVIEW, APPROVED, REJECTED, CHANGES_REQUESTED' })
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Reviewer Admin User ULID', nullable: true })
  reviewerId?: string | null;

  @ApiPropertyOptional({ description: 'Reviewer notes / feedback', nullable: true })
  reviewerNotes?: string | null;

  @ApiPropertyOptional({ description: 'Timestamp when review completed', nullable: true })
  reviewedAt?: Date | null;

  @ApiProperty({ description: 'Submitted timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}
