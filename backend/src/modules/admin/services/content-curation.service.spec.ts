import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentCurationService } from './content-curation.service';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { FeaturedCurationsRepository } from '../repositories/featured-curations.repository';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('ContentCurationService', () => {
  let service: ContentCurationService;
  let contentRepo: jest.Mocked<AdminContentRepository>;
  let curationsRepo: jest.Mocked<FeaturedCurationsRepository>;
  let auditService: jest.Mocked<AuditService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['CONTENT_ADMIN'],
    permissions: [],
  };

  const mockStory = {
    id: 'story_01',
    creatorId: 'creator_01',
    creatorName: 'Aria Stark',
    creatorHandle: 'ariastark',
    title: 'Winter In Paris',
    synopsis: 'A suspenseful romance',
    status: 'PUBLISHED' as any,
    contentRating: 'PG-13' as any,
    language: 'en',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    isInteractive: false,
    isFeatured: true,
    totalSeasons: 1,
    totalEpisodes: 5,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  };

  const mockCuration = {
    id: 'cur_01',
    storyId: 'story_01',
    storyTitle: 'Winter In Paris',
    storyThumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    collectionType: 'HOME_HERO' as any,
    displayOrder: 1,
    badge: 'Trending Now',
    customHeadline: 'Must Watch',
    isActive: true,
    startsAt: new Date('2026-10-01T00:00:00Z'),
    endsAt: new Date('2026-10-31T00:00:00Z'),
    curatedBy: 'user_admin',
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockContentRepo = {
      findStoriesPaginated: jest.fn(),
      findStoryDetail: jest.fn(),
      updateStatus: jest.fn(),
      updateMetadata: jest.fn(),
      countStoriesByStatus: jest.fn(),
    };

    const mockCurationsRepo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByStoryAndCollection: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countActive: jest.fn(),
    };

    const mockAudit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentCurationService,
        { provide: AdminContentRepository, useValue: mockContentRepo },
        { provide: FeaturedCurationsRepository, useValue: mockCurationsRepo },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ContentCurationService>(ContentCurationService);
    contentRepo = module.get(AdminContentRepository);
    curationsRepo = module.get(FeaturedCurationsRepository);
    auditService = module.get(AuditService);
  });

  describe('getStories', () => {
    it('should return paginated stories', async () => {
      contentRepo.findStoriesPaginated.mockResolvedValue({
        items: [mockStory as any],
        total: 1,
      });

      const result = await service.getStories({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('getStoryDetail', () => {
    it('should return story detail if found', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);

      const result = await service.getStoryDetail('story_01');
      expect(result.id).toBe('story_01');
    });

    it('should throw NotFoundException if not found', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(null);

      await expect(service.getStoryDetail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('curateStory', () => {
    it('should feature story by creating a new curation if not existing', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      curationsRepo.findByStoryAndCollection.mockResolvedValue(null);
      curationsRepo.create.mockResolvedValue(mockCuration as any);

      const result = await service.curateStory(
        'story_01',
        { isFeatured: true, collectionType: 'HOME_HERO', displayOrder: 1 },
        mockAdminUser,
      );

      expect(curationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: 'story_01',
          collectionType: 'HOME_HERO',
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STORY_CURATION_UPDATED',
          entityType: 'STORY',
        }),
      );
    });

    it('should unfeature story by updating existing curation to inactive', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      curationsRepo.findByStoryAndCollection.mockResolvedValue(mockCuration as any);

      await service.curateStory(
        'story_01',
        { isFeatured: false, collectionType: 'HOME_HERO' },
        mockAdminUser,
      );

      expect(curationsRepo.update).toHaveBeenCalledWith('cur_01', { isActive: false });
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('archiveStory', () => {
    it('should set story status to ARCHIVED and log audit record', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      contentRepo.updateStatus.mockResolvedValue({
        ...mockStory,
        status: 'ARCHIVED',
      } as any);

      const result = await service.archiveStory(
        'story_01',
        { reason: 'Copyright infringement notice' },
        mockAdminUser,
      );

      expect(contentRepo.updateStatus).toHaveBeenCalledWith('story_01', 'ARCHIVED');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STORY_ARCHIVED',
          entityId: 'story_01',
        }),
      );
      expect(result.success).toBe(true);
      expect(result.story!.status).toBe('ARCHIVED');
    });
  });

  describe('unpublishStory', () => {
    it('should revert status to DRAFT and log audit record', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      contentRepo.updateStatus.mockResolvedValue({
        ...mockStory,
        status: 'DRAFT',
      } as any);

      const result = await service.unpublishStory(
        'story_01',
        { reason: 'Quality guidelines check' },
        mockAdminUser,
      );

      expect(contentRepo.updateStatus).toHaveBeenCalledWith('story_01', 'DRAFT');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STORY_UNPUBLISHED',
          entityId: 'story_01',
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('overrideMetadata', () => {
    it('should override story metadata and log audit record', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      contentRepo.updateMetadata.mockResolvedValue({
        ...mockStory,
        title: 'New Title',
      } as any);

      const result = await service.overrideMetadata(
        'story_01',
        { title: 'New Title', ageRating: 'TV-MA' },
        mockAdminUser,
      );

      expect(contentRepo.updateMetadata).toHaveBeenCalledWith('story_01', {
        title: 'New Title',
        ageRating: 'TV-MA',
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STORY_METADATA_OVERRIDDEN',
        }),
      );
      expect(result!.title).toBe('New Title');
    });
  });

  describe('curations CRUD', () => {
    it('should list curations', async () => {
      curationsRepo.findMany.mockResolvedValue([mockCuration as any]);

      const list = await service.listCurations('HOME_HERO');
      expect(list).toHaveLength(1);
      expect(list[0]?.storyTitle).toBe('Winter In Paris');
    });

    it('should create curation', async () => {
      contentRepo.findStoryDetail.mockResolvedValue(mockStory as any);
      curationsRepo.create.mockResolvedValue(mockCuration as any);

      const res = await service.createCuration(
        {
          storyId: 'story_01',
          collectionType: 'HOME_HERO',
          displayOrder: 1,
        },
        mockAdminUser,
      );

      expect(curationsRepo.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
      expect(res.storyId).toBe('story_01');
    });

    it('should update curation', async () => {
      curationsRepo.findById.mockResolvedValue(mockCuration as any);
      curationsRepo.update.mockResolvedValue({
        ...mockCuration,
        badge: 'Updated Badge',
      } as any);

      const res = await service.updateCuration(
        'cur_01',
        { badge: 'Updated Badge' },
        mockAdminUser,
      );

      expect(curationsRepo.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should delete curation', async () => {
      curationsRepo.findById.mockResolvedValue(mockCuration as any);
      curationsRepo.delete.mockResolvedValue(true);

      const res = await service.deleteCuration('cur_01', mockAdminUser);
      expect(curationsRepo.delete).toHaveBeenCalledWith('cur_01');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FEATURED_CURATION_DELETED',
          entityId: 'cur_01',
        }),
      );
      expect(res.success).toBe(true);
    });
  });
});
