export const SEARCH_SERVICE = 'SEARCH_SERVICE';

export interface SearchFilters {
  genre?: string;
  language?: string;
  type?: 'all' | 'stories' | 'creators';
}

export interface PaginationDto {
  page?: number;
  limit?: number;
}

export interface StorySearchResultDto {
  id: string;
  title: string;
  synopsis: string;
  premise?: string | null;
  language: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  viewCount: number;
  genres: Array<{ id: string; name: string; slug: string }>;
  creator?: {
    id: string;
    displayName: string;
    tier: string;
  };
  score?: number;
}

export interface CreatorSearchResultDto {
  id: string;
  displayName: string;
  bio?: string | null;
  tier: string;
  score?: number;
}

export interface GenreSearchResultDto {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface SearchResultsDto {
  stories: StorySearchResultDto[];
  creators: CreatorSearchResultDto[];
  genres: GenreSearchResultDto[];
  totalStories: number;
  totalCreators: number;
}

export interface SearchService {
  search(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationDto,
  ): Promise<SearchResultsDto>;
}
