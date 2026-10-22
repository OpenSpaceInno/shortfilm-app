import { useQuery } from '@tanstack/react-query';
import { contentApi, searchApi, engagementApi } from '@/lib/api-client';
import { series as mockSeries, genres as mockGenres, getSeries as getMockSeries, type Series, type Season, type Episode } from '@/lib/catalog';

/**
 * Adapter mapping backend Story DTO to frontend Series interface.
 */
export function mapStoryDtoToSeries(dto: any, fallback?: Series): Series {
  if (!dto) return fallback || mockSeries[0]!;

  const slug = dto.id || fallback?.slug || 'story-preview';
  const genres = Array.isArray(dto.genres)
    ? dto.genres.map((g: any) => (typeof g === 'string' ? g : g.name || g.slug))
    : fallback?.genres || ['Drama'];

  const seasons: Season[] = Array.isArray(dto.seasons) && dto.seasons.length > 0
    ? dto.seasons.map((s: any, sIdx: number) => ({
        id: s.id || `${slug}-s${sIdx + 1}`,
        number: s.number ?? sIdx + 1,
        title: s.title || `Season ${sIdx + 1}`,
        episodes: Array.isArray(s.episodes)
          ? s.episodes.map((ep: any, epIdx: number) => ({
              id: ep.id || `${slug}-s${sIdx + 1}e${epIdx + 1}`,
              number: ep.number ?? epIdx + 1,
              title: ep.title || `Episode ${epIdx + 1}`,
              durationSec: ep.durationSeconds || ep.durationSec || 45,
              premium: ep.premium ?? (epIdx + 1 > 2),
              progress: ep.progress,
            }))
          : fallback?.seasons[sIdx]?.episodes || [],
      }))
    : fallback?.seasons || [
        {
          id: `${slug}-s1`,
          number: 1,
          title: 'Season 1',
          episodes: Array.from({ length: 6 }, (_, i) => ({
            id: `${slug}-s1e${i + 1}`,
            number: i + 1,
            title: `Episode ${i + 1}`,
            durationSec: 45,
            premium: i + 1 > 2,
          })),
        },
      ];

  const viewsCount = typeof dto.viewCount === 'number'
    ? `${(dto.viewCount / 1000).toFixed(1)}K`
    : fallback?.views || '12.4M';

  return {
    slug,
    title: dto.title || fallback?.title || 'Untitled Series',
    tagline: dto.premise || dto.synopsis || fallback?.tagline || '',
    synopsis: dto.synopsis || fallback?.synopsis || '',
    poster: dto.posterUrl || dto.thumbnailUrl || fallback?.poster || mockSeries[0]!.poster,
    genres,
    language: dto.language || fallback?.language || 'Hindi',
    ageRating: dto.contentRating || fallback?.ageRating || '16+',
    episodeCount: seasons.reduce((acc, s) => acc + s.episodes.length, 0),
    views: viewsCount,
    premium: dto.premium ?? fallback?.premium ?? true,
    trending: dto.trending ?? fallback?.trending ?? false,
    seasons,
  };
}

/**
 * Hook to list stories from backend feed with graceful mock fallback.
 */
export function useStories(query?: { genre?: string; trending?: boolean; limit?: number }) {
  return useQuery<Series[]>({
    queryKey: ['stories', query],
    queryFn: async () => {
      const res = await contentApi.listStories(query);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item, idx) => {
          const fallback = mockSeries[idx % mockSeries.length];
          return mapStoryDtoToSeries(item, fallback);
        });
      }
      // Graceful fallback to static catalog
      let filtered = [...mockSeries];
      if (query?.genre) {
        filtered = filtered.filter((s) => s.genres.includes(query.genre!));
      }
      if (query?.trending) {
        filtered = filtered.filter((s) => s.trending);
      }
      if (query?.limit) {
        filtered = filtered.slice(0, query.limit);
      }
      return filtered;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve featured hero stories.
 */
export function useFeaturedStories() {
  return useQuery<Series[]>({
    queryKey: ['stories', 'featured'],
    queryFn: async () => {
      const res = await contentApi.getFeaturedStories();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item, idx) => mapStoryDtoToSeries(item, mockSeries[idx % mockSeries.length]));
      }
      return mockSeries.filter((s) => s.trending);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch a single story by ID or slug.
 */
export function useStory(slugOrId: string) {
  return useQuery<Series>({
    queryKey: ['story', slugOrId],
    queryFn: async () => {
      // Check local mock first to grab default key art/posters
      const local = getMockSeries(slugOrId);
      const res = await contentApi.getStory(slugOrId);
      if (res.success && res.data) {
        return mapStoryDtoToSeries(res.data, local);
      }
      if (local) return local;
      throw new Error(`Story not found: ${slugOrId}`);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch all story genres.
 */
export function useGenres() {
  return useQuery<string[]>({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await contentApi.getGenres();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((g: any) => (typeof g === 'string' ? g : g.name));
      }
      return mockGenres;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to search across stories, creators, and genres.
 */
export function useSearch(query: string, options?: { genre?: string; limit?: number }) {
  return useQuery({
    queryKey: ['search', query, options],
    queryFn: async () => {
      if (!query.trim()) return { stories: [], totalStories: 0, creators: [] };
      const res = await searchApi.search(query, options);
      if (res.success && res.data) {
        const rawStories = Array.isArray(res.data.stories) ? res.data.stories : [];
        const stories: Series[] = rawStories.map((dto: any, idx: number) =>
          mapStoryDtoToSeries(dto, mockSeries[idx % mockSeries.length]),
        );
        return {
          stories,
          totalStories: res.data.totalStories ?? stories.length,
          creators: res.data.creators || [],
        };
      }
      // Local fallback search
      const q = query.toLowerCase();
      const localMatches = mockSeries.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.synopsis.toLowerCase().includes(q) ||
          s.genres.some((g) => g.toLowerCase().includes(q)),
      );
      return {
        stories: localMatches,
        totalStories: localMatches.length,
        creators: [],
      };
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook for continue watching feed.
 */
export function useContinueWatching() {
  return useQuery({
    queryKey: ['engagement', 'continue-watching'],
    queryFn: async () => {
      const res = await engagementApi.getContinueWatching();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return [];
    },
    staleTime: 1000 * 15,
  });
}
