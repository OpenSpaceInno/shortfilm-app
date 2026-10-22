import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GenresService } from '../services/genres.service';
import { GenreResponseDto } from '../dto/genre-response.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available content genres' })
  @ApiResponse({ status: 200, description: 'List of genres' })
  async getAllGenres(): Promise<ApiResponseDto<GenreResponseDto[]>> {
    const genres = await this.genresService.getAllGenres();
    return new ApiResponseDto(genres);
  }
}
