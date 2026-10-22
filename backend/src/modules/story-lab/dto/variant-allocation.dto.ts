import { IsString, IsNotEmpty } from 'class-validator';

export class AllocateVariantRequestDto {
  @IsString()
  @IsNotEmpty()
  experimentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class VariantAllocationResultDto {
  experimentId: string;
  userId: string;
  bucket: number;
  allocatedVariant: 'A' | 'B';
  variantId: string;
  variantKey: string;
  variantName: string;
  configJson?: Record<string, any> | null;
  status: string;
}
