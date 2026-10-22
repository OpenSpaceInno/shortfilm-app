import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreatorsRepository } from '../repositories/creators.repository';
import { CreatorApplicationsRepository } from '../repositories/creator-applications.repository';
import { CreatorVerificationsRepository } from '../repositories/creator-verifications.repository';
import { CreatorNotesRepository } from '../repositories/creator-notes.repository';
import { CreatorSubmissionsRepository } from '../repositories/creator-submissions.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DRIZZLE_DB } from '../../../database/database.service';

describe('CreatorsService', () => {
  let service: CreatorsService;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let applicationsRepo: jest.Mocked<CreatorApplicationsRepository>;
  let verificationsRepo: jest.Mocked<CreatorVerificationsRepository>;
  let notesRepo: jest.Mocked<CreatorNotesRepository>;
  let submissionsRepo: jest.Mocked<CreatorSubmissionsRepository>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const mockCreatorId = '01ARZ3NDEKTSV4RRFFQ69G5CR1';
  const mockAppId = '01ARZ3NDEKTSV4RRFFQ69G5AP1';

  beforeEach(async () => {
    const mockDbService = {
      getDb: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue({}),
          }),
        }),
        transaction: jest.fn().mockImplementation(async (cb) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([{ id: 'role_creator_id' }]),
                }),
              }),
            }),
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockResolvedValue({}),
            }),
            update: jest.fn().mockReturnValue({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue({}),
              }),
            }),
          };
          return cb(mockTx);
        }),
      }),
    };

    const mockCreatorsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      getProfileByCreatorId: jest.fn(),
      upsertProfile: jest.fn(),
      countStories: jest.fn().mockResolvedValue(5),
      countFollowers: jest.fn().mockResolvedValue(120),
    };

    const mockApplicationsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const mockVerificationsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findLatestByCreatorId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const mockNotesRepo = {
      create: jest.fn(),
      findByCreatorId: jest.fn(),
    };

    const mockSubmissionsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCreatorId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockNotificationsService = {
      dispatchNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        { provide: DRIZZLE_DB, useValue: mockDbService },
        { provide: CreatorsRepository, useValue: mockCreatorsRepo },
        { provide: CreatorApplicationsRepository, useValue: mockApplicationsRepo },
        { provide: CreatorVerificationsRepository, useValue: mockVerificationsRepo },
        { provide: CreatorNotesRepository, useValue: mockNotesRepo },
        { provide: CreatorSubmissionsRepository, useValue: mockSubmissionsRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
    creatorsRepo = module.get(CreatorsRepository);
    applicationsRepo = module.get(CreatorApplicationsRepository);
    verificationsRepo = module.get(CreatorVerificationsRepository);
    notesRepo = module.get(CreatorNotesRepository);
    submissionsRepo = module.get(CreatorSubmissionsRepository);
    notificationsService = module.get(NotificationsService);
  });

  describe('getPublicCreators', () => {
    it('should return paginated creators list with follower & story counts', async () => {
      creatorsRepo.findAll.mockResolvedValue({
        items: [
          {
            creator: {
              id: mockCreatorId,
              userId: mockUserId,
              displayName: 'Arjun Mehta',
              bio: 'Drama director',
              tier: 'VERIFIED',
              status: 'ACTIVE',
              verifiedAt: new Date(),
              suspensionReason: null,
              suspensionDate: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            profile: {
              id: 'prof_1',
              creatorId: mockCreatorId,
              tagline: 'Grounded family dramas',
              bio: 'Bio text',
              avatarUrl: 'https://avatar.png',
              coverImageUrl: null,
              location: 'Jaipur',
              category: 'Drama',
              genres: ['Drama'],
              languages: ['Hindi'],
              experience: '5 years',
              portfolioUrl: 'https://portfolio.com',
              websiteUrl: null,
              socialLinks: {},
              isFeatured: true,
              isRising: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        total: 1,
      });

      const result = await service.getPublicCreators({ limit: 10, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].displayName).toBe('Arjun Mehta');
      expect(result.items[0].followersCount).toBe(120);
      expect(result.items[0].storiesCount).toBe(5);
      expect(result.total).toBe(1);
    });
  });

  describe('getCreatorById', () => {
    it('should throw NotFoundException if creator does not exist', async () => {
      creatorsRepo.findById.mockResolvedValue(null);

      await expect(service.getCreatorById('missing_id')).rejects.toThrow(NotFoundException);
    });

    it('should return creator details if found', async () => {
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        displayName: 'Kabir Rao',
        bio: 'Cyberpunk creator',
        tier: 'EMERGING',
        status: 'ACTIVE',
        verifiedAt: null,
        suspensionReason: null,
        suspensionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      creatorsRepo.getProfileByCreatorId.mockResolvedValue(null);

      const creator = await service.getCreatorById(mockCreatorId);

      expect(creator.id).toBe(mockCreatorId);
      expect(creator.displayName).toBe('Kabir Rao');
      expect(creator.followersCount).toBe(120);
    });
  });

  describe('getMyCreatorProfile', () => {
    it('should throw NotFoundException if user is not a creator', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);

      await expect(service.getMyCreatorProfile(mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should return current creator profile', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        displayName: 'Priya Nair',
        bio: 'Romantic fiction',
        tier: 'PARTNER',
        status: 'ACTIVE',
        verifiedAt: new Date(),
        suspensionReason: null,
        suspensionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        displayName: 'Priya Nair',
        bio: 'Romantic fiction',
        tier: 'PARTNER',
        status: 'ACTIVE',
        verifiedAt: new Date(),
        suspensionReason: null,
        suspensionDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      creatorsRepo.getProfileByCreatorId.mockResolvedValue(null);

      const result = await service.getMyCreatorProfile(mockUserId);

      expect(result.displayName).toBe('Priya Nair');
    });
  });

  describe('submitApplication', () => {
    it('should throw ConflictException if user is already an active creator', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        status: 'ACTIVE',
      } as any);

      await expect(
        service.submitApplication(mockUserId, {
          applicantName: 'John Doe',
          creatorName: 'JD Studios',
          category: 'Thriller',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if user has a pending application', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);
      applicationsRepo.findActiveByUserId.mockResolvedValue({
        id: mockAppId,
        status: 'PENDING',
      } as any);

      await expect(
        service.submitApplication(mockUserId, {
          applicantName: 'John Doe',
          creatorName: 'JD Studios',
          category: 'Thriller',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should submit application successfully', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);
      applicationsRepo.findActiveByUserId.mockResolvedValue(null);
      applicationsRepo.create.mockResolvedValue({
        id: mockAppId,
        userId: mockUserId,
        applicantName: 'John Doe',
        creatorName: 'JD Studios',
        category: 'Thriller',
        genres: ['Thriller'],
        languages: ['Hindi'],
        bio: 'Aspiring creator',
        location: 'Mumbai',
        experience: '2 years',
        portfolioUrl: 'https://portfolio.com',
        proposedStory: { title: 'Shadows' },
        status: 'PENDING',
        reviewerId: null,
        reviewerNotes: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.submitApplication(mockUserId, {
        applicantName: 'John Doe',
        creatorName: 'JD Studios',
        category: 'Thriller',
      });

      expect(result.id).toBe(mockAppId);
      expect(result.status).toBe('PENDING');
      expect(applicationsRepo.create).toHaveBeenCalled();
    });
  });

  describe('reviewApplication', () => {
    const mockApp = {
      id: mockAppId,
      userId: mockUserId,
      applicantName: 'John Doe',
      creatorName: 'JD Studios',
      category: 'Thriller',
      genres: ['Thriller'],
      languages: ['Hindi'],
      bio: 'Bio text',
      location: 'Mumbai',
      experience: 'Credits',
      portfolioUrl: 'https://portfolio.com',
      proposedStory: null,
      status: 'PENDING',
      reviewerId: null,
      reviewerNotes: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update status to REJECTED on rejection', async () => {
      applicationsRepo.findById.mockResolvedValue(mockApp as any);
      applicationsRepo.update.mockResolvedValue({
        ...mockApp,
        status: 'REJECTED',
        reviewerNotes: 'Sample video failed criteria',
      } as any);

      const result = await service.reviewApplication(mockAppId, 'admin_1', {
        action: 'REJECT',
        reviewerNotes: 'Sample video failed criteria',
      });

      expect(result.status).toBe('REJECTED');
      expect(applicationsRepo.update).toHaveBeenCalledWith(
        mockAppId,
        expect.objectContaining({ status: 'REJECTED' }),
      );
    });

    it('should approve application, provision creator and assign CREATOR role', async () => {
      applicationsRepo.findById.mockResolvedValue(mockApp as any);
      applicationsRepo.update.mockResolvedValue({
        ...mockApp,
        status: 'APPROVED',
      } as any);
      creatorsRepo.findByUserId.mockResolvedValue(null);
      creatorsRepo.create.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        displayName: 'JD Studios',
        status: 'ACTIVE',
        tier: 'EMERGING',
      } as any);

      const result = await service.reviewApplication(mockAppId, 'admin_1', {
        action: 'APPROVE',
        reviewerNotes: 'Welcome to the platform',
      });

      expect(result.status).toBe('APPROVED');
      expect(creatorsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          displayName: 'JD Studios',
          status: 'ACTIVE',
        }),
        expect.anything(),
      );
      expect(creatorsRepo.upsertProfile).toHaveBeenCalled();
      expect(notificationsService.dispatchNotification).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'CREATOR_APPROVED',
        }),
      );
    });
  });

  describe('submitVerification & reviewVerification', () => {
    it('should submit verification document request', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
      } as any);
      verificationsRepo.create.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreatorId,
        documentType: 'ID_CARD',
        documentUrl: 'https://docs.com/id.pdf',
        status: 'PENDING',
        verifiedBy: null,
        reviewerNotes: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.submitVerification(mockUserId, {
        documentType: 'ID_CARD',
        documentUrl: 'https://docs.com/id.pdf',
      });

      expect(result.id).toBe('verif_1');
      expect(result.status).toBe('PENDING');
    });

    it('should approve verification and upgrade creator tier', async () => {
      verificationsRepo.findById.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreatorId,
      } as any);
      verificationsRepo.update.mockResolvedValue({
        id: 'verif_1',
        creatorId: mockCreatorId,
        status: 'VERIFIED',
        verifiedBy: 'admin_1',
        verifiedAt: new Date(),
        documentType: 'PASSPORT',
        documentUrl: 'https://docs.com/passport.pdf',
        reviewerNotes: 'Verified ID matches',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.reviewVerification('verif_1', 'admin_1', {
        status: 'VERIFIED',
        reviewerNotes: 'Verified ID matches',
      });

      expect(result.status).toBe('VERIFIED');
      expect(creatorsRepo.update).toHaveBeenCalledWith(
        mockCreatorId,
        expect.objectContaining({
          status: 'VERIFIED',
          tier: 'VERIFIED',
        }),
        expect.anything(),
      );
    });
  });

  describe('updateCreatorStatus & tier', () => {
    it('should update creator status and suspension details', async () => {
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
      } as any);
      creatorsRepo.getProfileByCreatorId.mockResolvedValue(null);

      await service.updateCreatorStatus(mockCreatorId, {
        status: 'SUSPENDED',
        suspensionReason: 'Copyright policy violation',
      });

      expect(creatorsRepo.update).toHaveBeenCalledWith(
        mockCreatorId,
        expect.objectContaining({
          status: 'SUSPENDED',
          suspensionReason: 'Copyright policy violation',
        }),
      );
    });

    it('should update creator tier', async () => {
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
      } as any);
      creatorsRepo.getProfileByCreatorId.mockResolvedValue(null);

      await service.updateCreatorTier(mockCreatorId, {
        tier: 'EXCLUSIVE',
      });

      expect(creatorsRepo.update).toHaveBeenCalledWith(
        mockCreatorId,
        expect.objectContaining({
          tier: 'EXCLUSIVE',
        }),
      );
    });
  });

  describe('internal notes', () => {
    it('should add and retrieve internal operational notes', async () => {
      creatorsRepo.findById.mockResolvedValue({ id: mockCreatorId } as any);
      notesRepo.create.mockResolvedValue({
        id: 'note_1',
        creatorId: mockCreatorId,
        authorId: 'admin_1',
        note: 'Outstanding pitch',
        createdAt: new Date(),
      });
      notesRepo.findByCreatorId.mockResolvedValue([
        {
          note: {
            id: 'note_1',
            creatorId: mockCreatorId,
            authorId: 'admin_1',
            note: 'Outstanding pitch',
            createdAt: new Date(),
          },
          authorName: 'Admin User',
        },
      ]);

      const note = await service.addInternalNote(mockCreatorId, 'admin_1', {
        note: 'Outstanding pitch',
      });
      expect(note.id).toBe('note_1');

      const notes = await service.getInternalNotes(mockCreatorId);
      expect(notes).toHaveLength(1);
      expect(notes[0].authorName).toBe('Admin User');
    });
  });

  describe('Creator Submissions Workflow (M17)', () => {
    const mockSubmissionId = '01ARZ3NDEKTSV4RRFFQ69SUB01';
    const mockVersionId = '01ARZ3NDEKTSV4RRFFQ69VER01';
    const mockStoryId = '01ARZ3NDEKTSV4RRFFQ69STR01';

    const baseSubmission = {
      id: mockSubmissionId,
      creatorId: mockCreatorId,
      creatorName: 'Arjun Mehta',
      storyId: mockStoryId,
      storyVersionId: mockVersionId,
      submissionType: 'FULL_SERIES' as const,
      title: 'The Midnight Train',
      synopsis: 'Six strangers board the final intercity express',
      scriptUrl: 'https://cdn.example.com/script.pdf',
      videoPreviewUrl: 'https://cdn.example.com/preview.mp4',
      status: 'DRAFT' as const,
      storyInfo: { episodeCount: 10, interactive: true },
      contentPreview: { poster: 'https://cdn.example.com/poster.jpg' },
      checklist: { contentComplete: true, metadataComplete: true },
      reviewerId: null,
      reviewerName: null,
      reviewerNotes: null,
      reviewedAt: null,
      submittedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a draft submission successfully', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        status: 'ACTIVE',
      } as any);

      submissionsRepo.create.mockResolvedValue(baseSubmission as any);
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);

      const result = await service.createSubmission(mockUserId, {
        title: 'The Midnight Train',
        synopsis: 'Six strangers board the final intercity express',
        submissionType: 'FULL_SERIES',
        storyId: mockStoryId,
        storyVersionId: mockVersionId,
      });

      expect(result.id).toBe(mockSubmissionId);
      expect(result.title).toBe('The Midnight Train');
      expect(result.status).toBe('DRAFT');
      expect(submissionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: mockCreatorId,
          title: 'The Midnight Train',
          status: 'DRAFT',
        }),
      );
    });

    it('should throw NotFoundException if non-creator tries to create submission', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);

      await expect(
        service.createSubmission(mockUserId, { title: 'Unknown' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if creator is suspended', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
        status: 'SUSPENDED',
      } as any);

      await expect(
        service.createSubmission(mockUserId, { title: 'Banned Story' }),
      ).rejects.toThrow('Creator account is suspended');
    });

    it('should get creator own submissions with pagination', async () => {
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      submissionsRepo.findByCreatorId.mockResolvedValue({
        items: [baseSubmission as any],
        total: 1,
      });

      const result = await service.getMySubmissions(mockUserId, { limit: 10, offset: 0 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.items[0].creatorName).toBe('Arjun Mehta');
    });

    it('should get submission by ID for owner creator', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      const result = await service.getSubmissionById(mockSubmissionId, mockUserId, false);
      expect(result.id).toBe(mockSubmissionId);
    });

    it('should allow admin to view any submission', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);

      const result = await service.getSubmissionById(mockSubmissionId, 'admin_user', true);
      expect(result.id).toBe(mockSubmissionId);
    });

    it('should throw ForbiddenException if user is not the owner creator', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: 'other_creator_id',
        userId: 'other_user_id',
      } as any);

      await expect(
        service.getSubmissionById(mockSubmissionId, 'other_user_id', false),
      ).rejects.toThrow('Forbidden');
    });

    it('should update draft submission', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        title: 'Updated Title',
      } as any);

      const result = await service.updateSubmission(mockUserId, mockSubmissionId, {
        title: 'Updated Title',
      });
      expect(result.title).toBe('Updated Title');
      expect(submissionsRepo.update).toHaveBeenCalledWith(
        mockSubmissionId,
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });

    it('should allow updating submission with CHANGES_REQUESTED status', async () => {
      submissionsRepo.findById.mockResolvedValue({
        ...baseSubmission,
        status: 'CHANGES_REQUESTED',
      } as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'CHANGES_REQUESTED',
        synopsis: 'Revised synopsis',
      } as any);

      const result = await service.updateSubmission(mockUserId, mockSubmissionId, {
        synopsis: 'Revised synopsis',
      });
      expect(result.synopsis).toBe('Revised synopsis');
    });

    it('should reject updating submission if already UNDER_REVIEW or APPROVED', async () => {
      submissionsRepo.findById.mockResolvedValue({
        ...baseSubmission,
        status: 'UNDER_REVIEW',
      } as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      await expect(
        service.updateSubmission(mockUserId, mockSubmissionId, { title: 'New' }),
      ).rejects.toThrow('Only submissions in \'DRAFT\' or \'CHANGES_REQUESTED\' status can be modified');
    });

    it('should submit submission for editorial review and sync linked version to IN_REVIEW', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      } as any);

      const result = await service.submitSubmission(mockUserId, mockSubmissionId);
      expect(result.status).toBe('SUBMITTED');
      expect(submissionsRepo.update).toHaveBeenCalledWith(
        mockSubmissionId,
        expect.objectContaining({ status: 'SUBMITTED' }),
      );
    });

    it('should reject submit if submission is already SUBMITTED', async () => {
      submissionsRepo.findById.mockResolvedValue({
        ...baseSubmission,
        status: 'SUBMITTED',
      } as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      await expect(
        service.submitSubmission(mockUserId, mockSubmissionId),
      ).rejects.toThrow('Submission cannot be submitted from current status');
    });

    it('should get admin review queue with filters', async () => {
      submissionsRepo.findAll.mockResolvedValue({
        items: [baseSubmission as any],
        total: 1,
      });

      const result = await service.getAdminSubmissions({ status: 'DRAFT', limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(submissionsRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', limit: 20 }),
      );
    });

    it('should review submission: UNDER_REVIEW', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'UNDER_REVIEW',
        reviewerId: 'admin_1',
      } as any);
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      const result = await service.reviewSubmission('admin_1', mockSubmissionId, {
        action: 'UNDER_REVIEW',
      });
      expect(result.status).toBe('UNDER_REVIEW');
    });

    it('should review submission: APPROVED and dispatch notification', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'APPROVED',
        reviewerId: 'admin_1',
        reviewerNotes: 'Approved for production',
      } as any);
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      const result = await service.reviewSubmission('admin_1', mockSubmissionId, {
        action: 'APPROVED',
        reviewerNotes: 'Approved for production',
      });
      expect(result.status).toBe('APPROVED');
      expect(notificationsService.dispatchNotification).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'SUBMISSION_STATUS_CHANGED',
        }),
      );
    });

    it('should review submission: CHANGES_REQUESTED and dispatch notification', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'CHANGES_REQUESTED',
        reviewerId: 'admin_1',
        reviewerNotes: 'Please refine Episode 2 cliffhanger',
      } as any);
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      const result = await service.reviewSubmission('admin_1', mockSubmissionId, {
        action: 'CHANGES_REQUESTED',
        reviewerNotes: 'Please refine Episode 2 cliffhanger',
      });
      expect(result.status).toBe('CHANGES_REQUESTED');
      expect(notificationsService.dispatchNotification).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'SUBMISSION_STATUS_CHANGED',
        }),
      );
    });

    it('should review submission: PUBLISHED and dispatch notification', async () => {
      submissionsRepo.findById.mockResolvedValue(baseSubmission as any);
      submissionsRepo.update.mockResolvedValue({
        ...baseSubmission,
        status: 'PUBLISHED',
      } as any);
      creatorsRepo.findById.mockResolvedValue({
        id: mockCreatorId,
        userId: mockUserId,
      } as any);

      const result = await service.reviewSubmission('admin_1', mockSubmissionId, {
        action: 'PUBLISHED',
      });
      expect(result.status).toBe('PUBLISHED');
      expect(notificationsService.dispatchNotification).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'SUBMISSION_STATUS_CHANGED',
        }),
      );
    });
  });
});
