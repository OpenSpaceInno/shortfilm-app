import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../../../database/schema';

export class SubmitCreatorVerificationDto {
  @ApiProperty({ description: 'Verification document type (ID_CARD, PASSPORT, BUSINESS_REG, TAX_DOC)' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ description: 'Secure URL or storage key of uploaded verification document' })
  @IsString()
  @IsNotEmpty()
  documentUrl: string;
}

export class ReviewCreatorVerificationDto {
  @ApiProperty({ description: 'Verification decision: VERIFIED or REJECTED', enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Review notes or reason for rejection' })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class CreatorVerificationResponseDto {
  @ApiProperty({ description: 'Verification record ULID' })
  id: string;

  @ApiProperty({ description: 'Creator ULID' })
  creatorId: string;

  @ApiProperty({ description: 'Verification status: NOT_VERIFIED, PENDING, VERIFIED, REJECTED, EXPIRED' })
  status: VerificationStatus;

  @ApiPropertyOptional({ description: 'Document type' })
  documentType?: string | null;

  @ApiPropertyOptional({ description: 'Document URL' })
  documentUrl?: string | null;

  @ApiPropertyOptional({ description: 'Admin user who verified', nullable: true })
  verifiedBy?: string | null;

  @ApiPropertyOptional({ description: 'Reviewer notes', nullable: true })
  reviewerNotes?: string | null;

  @ApiPropertyOptional({ description: 'Verified timestamp', nullable: true })
  verifiedAt?: Date | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}
