import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StoriesRepository } from '../repositories/stories.repository';
import { CreatorsRepository } from '../repositories/creators.repository';
import { GenresRepository } from '../repositories/genres.repository';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { EpisodesRepository } from '../repositories/episodes.repository';
import { CreateStoryDto } from '../dto/create-story.dto';
import { UpdateStoryDto } from '../dto/update-story.dto';
import { StoryQueryDto } from '../dto/story-query.dto';
import { StoryResponseDto } from '../dto/story-response.dto';
import { generateUlid } from '../../../database/utils/ulid.util';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@Injectable()
export class StoriesService {
  constructor(
    private readonly storiesRepository: StoriesRepository,
    private readonly creatorsRepository: CreatorsRepository,
    private readonly genresRepository: GenresRepository,
    private readonly seasonsRepository: SeasonsRepository,
    private readonly episodesRepository: EpisodesRepository,
  ) {}

  async getFeed(query: StoryQueryDto): Promise<{ items: StoryResponseDto[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { items, total } = await this.storiesRepository.findPublished({
      genreSlug: query.genre,
      language: query.language,
      sort: query.sort,
      limit,
      offset,
    });

    const responseItems: StoryResponseDto[] = await Promise.all(
      items.map(async (story) => {
        const storyGenres = await this.genresRepository.findForStory(story.id);
        return this.mapToResponse(story, storyGenres);
      }),
    );

    return { items: responseItems, total, page, limit };
  }

  async getFeatured(limit = 5): Promise<StoryResponseDto[]> {
    const stories = await this.storiesRepository.findFeatured(limit);
    return Promise.all(
      stories.map(async (story) => {
        const storyGenres = await this.genresRepository.findForStory(story.id);
        return this.mapToResponse(story, storyGenres);
      }),
    );
  }

  async getStoryById(id: string): Promise<StoryResponseDto> {
    const story = await this.storiesRepository.findByIdWithCreator(id);
    if (!story) {
      throw new NotFoundException(`Story with ID '${id}' not found`);
    }

    // Increment view count asynchronously in background
    this.storiesRepository.incrementViewCount(id).catch(() => {});

    const storyGenres = await this.genresRepository.findForStory(id);
    return this.mapToResponse(story, storyGenres);
  }

  async createDraft(user: AuthenticatedUser, dto: CreateStoryDto): Promise<StoryResponseDto> {
    // Ensure creator profile for authenticated creator user
    const creator = await this.creatorsRepository.ensureCreator(
      user.id,
      user.displayName || 'Creator',
    );

    const storyId = generateUlid();

    const newStory = await this.storiesRepository.create({
      id: storyId,
      creatorId: creator.id,
      title: dto.title,
      synopsis: dto.synopsis,
      premise: dto.premise,
      language: dto.language || 'en',
      thumbnailUrl: dto.thumbnailUrl,
      posterUrl: dto.posterUrl,
      contentRating: dto.contentRating,
      targetAudience: dto.targetAudience,
      status: 'DRAFT',
    });

    if (dto.genreIds && dto.genreIds.length > 0) {
      await this.genresRepository.linkStoryGenres(storyId, dto.genreIds);
    }

    const storyGenres = await this.genresRepository.findForStory(storyId);
    return this.mapToResponse({ ...newStory, creator }, storyGenres);
  }

  async updateStory(id: string, dto: UpdateStoryDto): Promise<StoryResponseDto> {
    const existing = await this.storiesRepository.findByIdWithCreator(id);
    if (!existing) {
      throw new NotFoundException(`Story with ID '${id}' not found`);
    }

    const updated = await this.storiesRepository.update(id, {
      title: dto.title,
      synopsis: dto.synopsis,
      premise: dto.premise,
      language: dto.language,
      thumbnailUrl: dto.thumbnailUrl,
      posterUrl: dto.posterUrl,
      contentRating: dto.contentRating,
      targetAudience: dto.targetAudience,
    });

    if (dto.genreIds && dto.genreIds.length > 0) {
      await this.genresRepository.linkStoryGenres(id, dto.genreIds);
    }

    const storyGenres = await this.genresRepository.findForStory(id);
    return this.mapToResponse({ ...updated, creator: existing.creator }, storyGenres);
  }

  async deleteStory(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.storiesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Story with ID '${id}' not found`);
    }

    await this.storiesRepository.softDelete(id);
    return { success: true, message: `Story '${id}' has been soft deleted` };
  }

  async publishStory(id: string): Promise<StoryResponseDto> {
    const existing = await this.storiesRepository.findByIdWithCreator(id);
    if (!existing) {
      throw new NotFoundException(`Story with ID '${id}' not found`);
    }

    // Domain invariant: Must have at least 1 season
    const seasonCount = await this.seasonsRepository.countForStory(id);
    if (seasonCount === 0) {
      throw new BadRequestException('Cannot publish story without at least one season');
    }

    // Domain invariant: Must have at least 1 episode
    const episodeCount = await this.episodesRepository.countForStory(id);
    if (episodeCount === 0) {
      throw new BadRequestException('Cannot publish story without at least one episode');
    }

    const published = await this.storiesRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    const storyGenres = await this.genresRepository.findForStory(id);
    return this.mapToResponse({ ...published, creator: existing.creator }, storyGenres);
  }

  private mapToResponse(story: any, genres: any[] = []): StoryResponseDto {
    return {
      id: story.id,
      creatorId: story.creatorId,
      creator: story.creator
        ? {
            id: story.creator.id,
            displayName: story.creator.displayName,
            tier: story.creator.tier,
          }
        : undefined,
      title: story.title,
      synopsis: story.synopsis,
      premise: story.premise,
      status: story.status,
      language: story.language,
      thumbnailUrl: story.thumbnailUrl,
      posterUrl: story.posterUrl,
      contentRating: story.contentRating,
      targetAudience: story.targetAudience,
      viewCount: Number(story.viewCount || 0),
      genres: genres.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        icon: g.icon,
      })),
      publishedAt: story.publishedAt,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };
  }
}
