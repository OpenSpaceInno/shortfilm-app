import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SEARCH_SERVICE, SearchService, SearchResultsDto } from '../interfaces/search.interface';
import { SearchQueryDto } from '../dto/search-query.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    @Inject(SEARCH_SERVICE) private readonly searchService: SearchService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Unified search across stories, creators, and genres' })
  @ApiResponse({ status: 200, description: 'Matching search results' })
  async search(@Query() query: SearchQueryDto): Promise<ApiResponseDto<SearchResultsDto>> {
    const results = await this.searchService.search(
      query.q,
      {
        type: query.type,
        genre: query.genre,
        language: query.language,
      },
      {
        page: query.page,
        limit: query.limit,
      },
    );

    return new ApiResponseDto(results, {
      page: query.page || 1,
      limit: query.limit || 20,
      totalStories: results.totalStories,
      totalCreators: results.totalCreators,
    });
  }
}
