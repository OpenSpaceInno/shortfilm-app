import { NotFoundException } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { EpisodesRepository } from '../repositories/episodes.repository';
import { SeasonsRepository } from '../repositories/seasons.repository';

describe('EpisodesService', () => {
  let service: EpisodesService;
  let episodesRepo: jest.Mocked<EpisodesRepository>;
  let seasonsRepo: jest.Mocked<SeasonsRepository>;

  const mockSeason = {
    id: '01HVG7J0000000000000000020',
    storyId: '01HVG7J0000000000000000010',
    title: 'Season 1: Quantum Collapse',
    seasonNumber: 1,
    synopsis: 'The fracture point',
    createdAt: new Date(),
  };

  const mockEpisode = {
    id: '01HVG7J0000000000000000030',
    seasonId: mockSeason.id,
    title: 'The Midnight Paradox',
    episodeNumber: 1,
    synopsis: 'Clara notices the anomaly',
    thumbnailUrl: 'https://example.com/ep1.jpg',
    isFree: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    episodesRepo = {
      findBySeasonId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countForSeason: jest.fn(),
      countForStory: jest.fn(),
    } as any;

    seasonsRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      findByStoryId: jest.fn(),
      countForStory: jest.fn(),
    } as any;

    service = new EpisodesService(episodesRepo, seasonsRepo);
  });

  describe('getEpisodesBySeason', () => {
    it('should return episodes when season exists', async () => {
      seasonsRepo.findById.mockResolvedValue(mockSeason as any);
      episodesRepo.findBySeasonId.mockResolvedValue([mockEpisode as any]);

      const result = await service.getEpisodesBySeason(mockSeason.id);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('The Midnight Paradox');
      expect(result[0].isFree).toBe(true);
    });

    it('should throw NotFoundException if season does not exist', async () => {
      seasonsRepo.findById.mockResolvedValue(null);

      await expect(service.getEpisodesBySeason('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEpisodeById', () => {
    it('should return episode details', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);

      const result = await service.getEpisodeById(mockEpisode.id);
      expect(result.id).toBe(mockEpisode.id);
      expect(result.title).toBe(mockEpisode.title);
    });

    it('should throw NotFoundException if episode does not exist', async () => {
      episodesRepo.findById.mockResolvedValue(null);

      await expect(service.getEpisodeById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createEpisode', () => {
    it('should create episode for existing season', async () => {
      seasonsRepo.findById.mockResolvedValue(mockSeason as any);
      episodesRepo.create.mockResolvedValue(mockEpisode as any);

      const result = await service.createEpisode(mockSeason.id, {
        title: 'New Episode',
        episodeNumber: 2,
        isFree: false,
      });

      expect(episodesRepo.create).toHaveBeenCalled();
      expect(result.title).toBe(mockEpisode.title);
    });
  });
});
