import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SettingCategory, settingCategoryEnum } from '../../../database/schema/admin.schema';

export class UpdateSettingDto {
  @ApiProperty({ description: 'Dynamic JSON setting value (string, number, boolean, array, or object)' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ description: 'Whether client applications can read this setting' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Updated documentation description for this setting' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SettingItemUpdateDto {
  @ApiProperty({ description: 'Setting unique identifier key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Setting value' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ description: 'Whether client applications can read this setting' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class BatchUpdateSettingsDto {
  @ApiProperty({ type: [SettingItemUpdateDto], description: 'List of settings to update atomically' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemUpdateDto)
  settings: SettingItemUpdateDto[];
}

export class QuerySettingsDto {
  @ApiPropertyOptional({ enum: settingCategoryEnum, description: 'Filter settings by functional category' })
  @IsOptional()
  @IsEnum(settingCategoryEnum)
  category?: SettingCategory;

  @ApiPropertyOptional({ description: 'Filter only public settings visible to frontend clients' })
  @IsOptional()
  @IsBoolean()
  isPublicOnly?: boolean;
}

export class SettingResponseDto {
  @ApiProperty({ description: 'Unique ULID' })
  id: string;

  @ApiProperty({ enum: settingCategoryEnum })
  category: SettingCategory;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: any;

  @ApiProperty()
  valueType: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  updatedBy?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
