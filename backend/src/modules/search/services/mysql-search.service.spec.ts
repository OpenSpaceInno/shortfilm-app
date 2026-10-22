import { MysqlSearchService } from './mysql-search.service';
import { DatabaseService } from '../../../database/database.service';

describe('MysqlSearchService', () => {
  let service: MysqlSearchService;
  let dbService: jest.Mocked<DatabaseService>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
    };

    dbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    } as any;

    service = new MysqlSearchService(dbService);
  });

  it('should return empty results when query is whitespace', async () => {
    const result = await service.search('   ');
    expect(result.stories).toEqual([]);
    expect(result.creators).toEqual([]);
    expect(result.totalStories).toBe(0);
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('should query stories, creators, and genres for unified search', async () => {
    const mockStoryRow = {
      id: Buffer.from('0123456789abcdef'),
      title: 'The Quantum Divergence',
      synopsis: 'A sci-fi journey',
      premise: 'Choose reality',
      language: 'en',
      thumbnail_url: 'https://example.com/thumb.jpg',
      poster_url: 'https://example.com/poster.jpg',
      view_count: 500,
      creator_id: Buffer.from('abcdef0123456789'),
      creator_name: 'Elena Vance',
      creator_tier: 'VERIFIED',
      score: 1.5,
    };

    const mockCreatorRow = {
      id: Buffer.from('abcdef0123456789'),
      display_name: 'Elena Vance',
      bio: 'Sci-fi creator',
      tier: 'VERIFIED',
      score: 1.2,
    };

    const mockGenreRow = {
      id: Buffer.from('1111222233334444'),
      name: 'Sci-Fi',
      slug: 'sci-fi',
      icon: 'zap',
    };

    // Mock query calls
    mockDb.execute
      .mockResolvedValueOnce([[mockStoryRow]]) // Stories query
      .mockResolvedValueOnce([[]]) // Story genres query
      .mockResolvedValueOnce([[{ count: 1 }]]) // Count stories query
      .mockResolvedValueOnce([[mockCreatorRow]]) // Creators query
      .mockResolvedValueOnce([[mockGenreRow]]); // Genres query

    const result = await service.search('Quantum');

    expect(result.stories.length).toBe(1);
    expect(result.stories[0].title).toBe('The Quantum Divergence');
    expect(result.stories[0].creator?.displayName).toBe('Elena Vance');
    expect(result.creators.length).toBe(1);
    expect(result.creators[0].displayName).toBe('Elena Vance');
    expect(result.genres.length).toBe(1);
    expect(result.genres[0].slug).toBe('sci-fi');
    expect(result.totalStories).toBe(1);
  });

  it('should serve subsequent identical requests from 15-minute cache', async () => {
    mockDb.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ count: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    // First search: populates cache
    await service.search('Divergence');
    const firstCallCount = mockDb.execute.mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0);

    // Second search with identical query: hits cache
    const cachedResult = await service.search('Divergence');
    expect(mockDb.execute.mock.calls.length).toBe(firstCallCount);
    expect(cachedResult).toBeDefined();
  });

  it('should filter by type=stories without querying creators', async () => {
    mockDb.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ count: 0 }]]);

    const result = await service.search('Divergence', { type: 'stories' });
    expect(result.creators).toEqual([]);
  });
});
