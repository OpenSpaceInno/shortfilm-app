import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateDirectUploadDto {
  @IsString()
  @IsNotEmpty()
  episodeId: string;

  @IsInt()
  @IsOptional()
  @Min(10)
  @Max(7200)
  maxDurationSeconds?: number = 3600;
}

export interface DirectUploadResponseDto {
  videoId: string;
  episodeId: string;
  uploadUrl: string;
  providerUid: string;
  provider: string;
  status: string;
}
