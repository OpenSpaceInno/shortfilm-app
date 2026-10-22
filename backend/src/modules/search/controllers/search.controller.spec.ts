import { SearchController } from './search.controller';
import { SearchService } from '../interfaces/search.interface';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  beforeEach(() => {
    searchService = {
      search: jest.fn(),
    };

    controller = new SearchController(searchService);
  });

  it('should delegate search to service and wrap in canonical ApiResponseDto', async () => {
    searchService.search.mockResolvedValue({
      stories: [
        {
          id: '01HVG7J0000000000000000010',
          title: 'The Quantum Divergence',
          synopsis: 'A gripping sci-fi narrative',
          language: 'en',
          viewCount: 14200,
          genres: [{ id: '01HVG7J0000000000000000001', name: 'Sci-Fi', slug: 'sci-fi' }],
        },
      ],
      creators: [],
      genres: [],
      totalStories: 1,
      totalCreators: 0,
    });

    const response = await controller.search({ q: 'Quantum', page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data.stories.length).toBe(1);
    expect(response.data.stories[0].title).toBe('The Quantum Divergence');
    expect(response.meta?.totalStories).toBe(1);
    expect(searchService.search).toHaveBeenCalledWith(
      'Quantum',
      { type: undefined, genre: undefined, language: undefined },
      { page: 1, limit: 10 },
    );
  });
});
