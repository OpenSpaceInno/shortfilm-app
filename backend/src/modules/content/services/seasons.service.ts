import { Injectable, NotFoundException } from '@nestjs/common';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { StoriesRepository } from '../repositories/stories.repository';
import { CreateSeasonDto, SeasonResponseDto } from '../dto/create-season.dto';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly seasonsRepository: SeasonsRepository,
    private readonly storiesRepository: StoriesRepository,
  ) {}

  async getSeasonsByStoryId(storyId: string): Promise<SeasonResponseDto[]> {
    const story = await this.storiesRepository.findById(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const seasons = await this.seasonsRepository.findByStoryId(storyId);
    return seasons.map((s) => ({
      id: s.id,
      storyId: s.storyId,
      title: s.title,
      seasonNumber: s.seasonNumber,
      synopsis: s.synopsis,
      createdAt: s.createdAt,
    }));
  }

  async createSeason(storyId: string, dto: CreateSeasonDto): Promise<SeasonResponseDto> {
    const story = await this.storiesRepository.findById(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const season = await this.seasonsRepository.create({
      id: generateUlid(),
      storyId,
      title: dto.title,
      seasonNumber: dto.seasonNumber,
      synopsis: dto.synopsis,
    });

    return {
      id: season.id,
      storyId: season.storyId,
      title: season.title,
      seasonNumber: season.seasonNumber,
      synopsis: season.synopsis,
      createdAt: season.createdAt,
    };
  }
}
