import { Injectable, NotFoundException } from '@nestjs/common';
import { EpisodesRepository } from '../repositories/episodes.repository';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { CreateEpisodeDto, EpisodeResponseDto } from '../dto/create-episode.dto';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class EpisodesService {
  constructor(
    private readonly episodesRepository: EpisodesRepository,
    private readonly seasonsRepository: SeasonsRepository,
  ) {}

  async getEpisodesBySeason(seasonId: string): Promise<EpisodeResponseDto[]> {
    const season = await this.seasonsRepository.findById(seasonId);
    if (!season) {
      throw new NotFoundException(`Season with ID '${seasonId}' not found`);
    }

    const episodes = await this.episodesRepository.findBySeasonId(seasonId);
    return episodes.map((e) => ({
      id: e.id,
      seasonId: e.seasonId,
      title: e.title,
      episodeNumber: e.episodeNumber,
      synopsis: e.synopsis,
      thumbnailUrl: e.thumbnailUrl,
      isFree: e.isFree,
      publishedAt: e.publishedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  async getEpisodeById(id: string): Promise<EpisodeResponseDto> {
    const episode = await this.episodesRepository.findById(id);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${id}' not found`);
    }

    return {
      id: episode.id,
      seasonId: episode.seasonId,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      synopsis: episode.synopsis,
      thumbnailUrl: episode.thumbnailUrl,
      isFree: episode.isFree,
      publishedAt: episode.publishedAt,
      createdAt: episode.createdAt,
      updatedAt: episode.updatedAt,
    };
  }

  async createEpisode(seasonId: string, dto: CreateEpisodeDto): Promise<EpisodeResponseDto> {
    const season = await this.seasonsRepository.findById(seasonId);
    if (!season) {
      throw new NotFoundException(`Season with ID '${seasonId}' not found`);
    }

    const episode = await this.episodesRepository.create({
      id: generateUlid(),
      seasonId,
      title: dto.title,
      episodeNumber: dto.episodeNumber,
      synopsis: dto.synopsis,
      thumbnailUrl: dto.thumbnailUrl,
      isFree: dto.isFree || false,
      publishedAt: new Date(),
    });

    return {
      id: episode.id,
      seasonId: episode.seasonId,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      synopsis: episode.synopsis,
      thumbnailUrl: episode.thumbnailUrl,
      isFree: episode.isFree,
      publishedAt: episode.publishedAt,
      createdAt: episode.createdAt,
      updatedAt: episode.updatedAt,
    };
  }
}
