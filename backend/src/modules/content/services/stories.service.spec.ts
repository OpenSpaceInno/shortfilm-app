import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesRepository } from '../repositories/stories.repository';
import { CreatorsRepository } from '../repositories/creators.repository';
import { GenresRepository } from '../repositories/genres.repository';
import { SeasonsRepository } from '../repositories/seasons.repository';
import { EpisodesRepository } from '../repositories/episodes.repository';

describe('StoriesService', () => {
  let service: StoriesService;
  let storiesRepo: jest.Mocked<StoriesRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let genresRepo: jest.Mocked<GenresRepository>;
  let seasonsRepo: jest.Mocked<SeasonsRepository>;
  let episodesRepo: jest.Mocked<EpisodesRepository>;

  const mockCreator = {
    id: '01HVG7J0000000000000000001',
    userId: '01HVG7J0000000000000000002',
    displayName: 'Elena Vance',
    bio: 'Sci-Fi Director',
    tier: 'VERIFIED' as const,
    status: 'ACTIVE' as const,
    verifiedAt: new Date(),
    suspensionReason: null,
    suspensionDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStory = {
    id: '01HVG7J0000000000000000010',
    creatorId: mockCreator.id,
    creator: mockCreator,
    title: 'The Quantum Divergence',
    synopsis: 'A gripping sci-fi interactive journey',
    premise: 'Choose your timeline',
    status: 'DRAFT' as const,
    language: 'en',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    posterUrl: 'https://example.com/poster.jpg',
    contentRating: '16+',
    targetAudience: 'Sci-Fi Fans',
    viewCount: 100,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    storiesRepo = {
      findPublished: jest.fn(),
      findFeatured: jest.fn(),
      findByIdWithCreator: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      incrementViewCount: jest.fn().mockResolvedValue(undefined),
    } as any;

    creatorsRepo = {
      ensureCreator: jest.fn(),
    } as any;

    genresRepo = {
      findForStory: jest.fn().mockResolvedValue([]),
      linkStoryGenres: jest.fn().mockResolvedValue(undefined),
    } as any;

    seasonsRepo = {
      countForStory: jest.fn(),
    } as any;

    episodesRepo = {
      countForStory: jest.fn(),
    } as any;

    service = new StoriesService(
      storiesRepo,
      creatorsRepo,
      genresRepo,
      seasonsRepo,
      episodesRepo,
    );
  });

  describe('getFeed', () => {
    it('should return paginated published stories', async () => {
      storiesRepo.findPublished.mockResolvedValue({
        items: [mockStory as any],
        total: 1,
      });

      const result = await service.getFeed({ page: 1, limit: 10 });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.items[0].title).toBe('The Quantum Divergence');
    });
  });

  describe('getStoryById', () => {
    it('should return story detail and trigger view count increment', async () => {
      storiesRepo.findByIdWithCreator.mockResolvedValue(mockStory as any);

      const result = await service.getStoryById(mockStory.id);
      expect(result.id).toBe(mockStory.id);
      expect(storiesRepo.incrementViewCount).toHaveBeenCalledWith(mockStory.id);
    });

    it('should throw NotFoundException if story does not exist', async () => {
      storiesRepo.findByIdWithCreator.mockResolvedValue(null);

      await expect(service.getStoryById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDraft', () => {
    it('should auto-ensure creator and create story draft', async () => {
      creatorsRepo.ensureCreator.mockResolvedValue(mockCreator);
      storiesRepo.create.mockResolvedValue(mockStory as any);

      const mockUser = {
        id: mockCreator.userId,
        email: 'creator@shortreel.com',
        displayName: 'Elena Vance',
        roles: ['CREATOR'],
      } as any;

      const result = await service.createDraft(mockUser, {
        title: 'New Story',
        synopsis: 'A brand new narrative',
      });

      expect(creatorsRepo.ensureCreator).toHaveBeenCalledWith(mockUser.id, 'Elena Vance');
      expect(storiesRepo.create).toHaveBeenCalled();
      expect(result.title).toBe(mockStory.title);
    });
  });

  describe('publishStory', () => {
    it('should throw BadRequestException if story has zero seasons', async () => {
      storiesRepo.findByIdWithCreator.mockResolvedValue(mockStory as any);
      seasonsRepo.countForStory.mockResolvedValue(0);

      await expect(service.publishStory(mockStory.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if story has zero episodes', async () => {
      storiesRepo.findByIdWithCreator.mockResolvedValue(mockStory as any);
      seasonsRepo.countForStory.mockResolvedValue(1);
      episodesRepo.countForStory.mockResolvedValue(0);

      await expect(service.publishStory(mockStory.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should publish story when seasons and episodes exist', async () => {
      storiesRepo.findByIdWithCreator.mockResolvedValue(mockStory as any);
      seasonsRepo.countForStory.mockResolvedValue(1);
      episodesRepo.countForStory.mockResolvedValue(2);
      storiesRepo.update.mockResolvedValue({
        ...mockStory,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      } as any);

      const result = await service.publishStory(mockStory.id);
      expect(result.status).toBe('PUBLISHED');
      expect(storiesRepo.update).toHaveBeenCalledWith(
        mockStory.id,
        expect.objectContaining({ status: 'PUBLISHED' }),
      );
    });
  });
});
