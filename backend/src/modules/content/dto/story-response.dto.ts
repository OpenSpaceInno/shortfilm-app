export interface StoryCreatorResponse {
  id: string;
  displayName: string;
  tier: string;
}

export interface StoryGenreResponse {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface StoryResponseDto {
  id: string;
  creatorId: string;
  creator?: StoryCreatorResponse;
  title: string;
  synopsis: string;
  premise?: string | null;
  status: string;
  language: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  contentRating?: string | null;
  targetAudience?: string | null;
  viewCount: number;
  genres?: StoryGenreResponse[];
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
