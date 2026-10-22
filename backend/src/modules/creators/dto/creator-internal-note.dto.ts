import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreatorInternalNoteDto {
  @ApiProperty({ description: 'Internal commentary / operational note text' })
  @IsString()
  @IsNotEmpty()
  note: string;
}

export class CreatorInternalNoteDto {
  @ApiProperty({ description: 'Note ULID' })
  id: string;

  @ApiProperty({ description: 'Creator ULID' })
  creatorId: string;

  @ApiProperty({ description: 'Staff Author User ULID' })
  authorId: string;

  @ApiProperty({ description: 'Author display name', required: false })
  authorName?: string;

  @ApiProperty({ description: 'Note content' })
  note: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
