import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { CreatorsRepository } from '../repositories/creators.repository';
import { CreatorApplicationsRepository } from '../repositories/creator-applications.repository';
import { CreatorVerificationsRepository } from '../repositories/creator-verifications.repository';
import { CreatorNotesRepository } from '../repositories/creator-notes.repository';
import { CreatorSubmissionsRepository } from '../repositories/creator-submissions.repository';
import { CreatorEarningsService } from './creator-earnings.service';
import { CreatorAnalyticsService } from './creator-analytics.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { roles, userRoles } from '../../../database/schema/identity.schema';
import {
  CreatorQueryDto,
  PaginatedCreatorsDto,
  CreatorResponseDto,
  UpdateCreatorProfileDto,
  SubmitCreatorApplicationDto,
  ReviewCreatorApplicationDto,
  CreatorApplicationResponseDto,
  SubmitCreatorVerificationDto,
  ReviewCreatorVerificationDto,
  CreatorVerificationResponseDto,
  CreateCreatorInternalNoteDto,
  CreatorInternalNoteDto,
  UpdateCreatorStatusDto,
  UpdateCreatorTierDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  ReviewSubmissionDto,
  SubmissionQueryDto,
  CreatorSubmissionResponseDto,
  PaginatedSubmissionsDto,
} from '../dto';
import {
  ApplicationStatus,
  CreatorStatus,
  CreatorTier,
  storyVersions,
  stories,
  CreatorSubmission,
} from '../../../database/schema';

@Injectable()
export class CreatorsService {
  private readonly logger = new Logger(CreatorsService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly creatorsRepo: CreatorsRepository,
    private readonly applicationsRepo: CreatorApplicationsRepository,
    private readonly verificationsRepo: CreatorVerificationsRepository,
    private readonly notesRepo: CreatorNotesRepository,
    private readonly submissionsRepo: CreatorSubmissionsRepository,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly earningsService?: CreatorEarningsService,
    @Optional() private readonly analyticsService?: CreatorAnalyticsService,
  ) {}

  /**
   * Public discovery feed of creators with filtering and pagination
   */
  async getPublicCreators(query: CreatorQueryDto): Promise<PaginatedCreatorsDto> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const { items, total } = await this.creatorsRepo.findAll({
      tier: query.tier,
      status: query.status,
      category: query.category,
      featured: query.featured,
      search: query.search,
      limit,
      offset,
    });

    const formatted: CreatorResponseDto[] = [];
    for (const item of items) {
      const [followersCount, storiesCount] = await Promise.all([
        this.creatorsRepo.countFollowers(item.creator.id),
        this.creatorsRepo.countStories(item.creator.id),
      ]);

      formatted.push({
        id: item.creator.id,
        userId: item.creator.userId,
        displayName: item.creator.displayName,
        bio: item.creator.bio,
        tier: item.creator.tier,
        status: item.creator.status,
        verifiedAt: item.creator.verifiedAt,
        suspensionReason: item.creator.suspensionReason,
        suspensionDate: item.creator.suspensionDate,
        profile: item.profile
          ? {
              tagline: item.profile.tagline,
              bio: item.profile.bio,
              avatarUrl: item.profile.avatarUrl,
              coverImageUrl: item.profile.coverImageUrl,
              location: item.profile.location,
              category: item.profile.category,
              genres: item.profile.genres,
              languages: item.profile.languages,
              experience: item.profile.experience,
              portfolioUrl: item.profile.portfolioUrl,
              websiteUrl: item.profile.websiteUrl,
              socialLinks: item.profile.socialLinks,
              isFeatured: item.profile.isFeatured,
              isRising: item.profile.isRising,
            }
          : null,
        followersCount,
        storiesCount,
        createdAt: item.creator.createdAt,
        updatedAt: item.creator.updatedAt,
      });
    }

    return {
      items: formatted,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Public or admin detail view for a specific creator
   */
  async getCreatorById(id: string): Promise<CreatorResponseDto> {
    const creator = await this.creatorsRepo.findById(id);
    if (!creator) {
      throw new NotFoundException(`Creator with ID '${id}' not found`);
    }

    const [profile, followersCount, storiesCount] = await Promise.all([
      this.creatorsRepo.getProfileByCreatorId(id),
      this.creatorsRepo.countFollowers(id),
      this.creatorsRepo.countStories(id),
    ]);

    return {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      bio: creator.bio,
      tier: creator.tier,
      status: creator.status,
      verifiedAt: creator.verifiedAt,
      suspensionReason: creator.suspensionReason,
      suspensionDate: creator.suspensionDate,
      profile: profile
        ? {
            tagline: profile.tagline,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            coverImageUrl: profile.coverImageUrl,
            location: profile.location,
            category: profile.category,
            genres: profile.genres,
            languages: profile.languages,
            experience: profile.experience,
            portfolioUrl: profile.portfolioUrl,
            websiteUrl: profile.websiteUrl,
            socialLinks: profile.socialLinks,
            isFeatured: profile.isFeatured,
            isRising: profile.isRising,
          }
        : null,
      followersCount,
      storiesCount,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };
  }

  /**
   * Get authenticated user's own creator profile
   */
  async getMyCreatorProfile(userId: string): Promise<CreatorResponseDto> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      throw new NotFoundException('Authenticated user is not registered as a creator');
    }

    return this.getCreatorById(creator.id);
  }

  /**
   * Update authenticated creator's profile and media metadata
   */
  async updateMyCreatorProfile(
    userId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorResponseDto> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      throw new NotFoundException('Authenticated user is not registered as a creator');
    }

    if (dto.displayName || dto.bio !== undefined) {
      await this.creatorsRepo.update(creator.id, {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      });
    }

    await this.creatorsRepo.upsertProfile(creator.id, {
      tagline: dto.tagline,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      coverImageUrl: dto.coverImageUrl,
      location: dto.location,
      category: dto.category,
      genres: dto.genres,
      languages: dto.languages,
      experience: dto.experience,
      portfolioUrl: dto.portfolioUrl,
      websiteUrl: dto.websiteUrl,
      socialLinks: dto.socialLinks,
    });

    return this.getCreatorById(creator.id);
  }

  /**
   * Unified Creator Studio Workspace Dashboard (M16/M17/M19/M20)
   */
  async getMyDashboard(userId: string): Promise<any> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      return {
        registered: false,
        metrics: {
          totalStories: 0,
          publishedStories: 0,
          inReviewSubmissions: 0,
          totalViews: 0,
          followersCount: 0,
        },
        stories: [],
        submissions: [],
        earningsSummary: null,
        analyticsOverview: null,
      };
    }

    const [
      creatorProfile,
      creatorStories,
      submissionsResult,
      earningsSummary,
      analyticsOverview,
    ] = await Promise.all([
      this.getCreatorById(creator.id),
      this.creatorsRepo.findStoriesByCreatorId(creator.id, { limit: 20 }),
      this.submissionsRepo.findByCreatorId(creator.id, { limit: 20 }),
      this.earningsService
        ? this.earningsService.getCreatorEarningsSummary(userId).catch(() => null)
        : null,
      this.analyticsService
        ? this.analyticsService.getOverviewForUser(userId, {}).catch(() => null)
        : null,
    ]);

    const publishedCount = creatorStories.filter((s: any) => s.status === 'PUBLISHED').length;
    const inReviewCount = submissionsResult.items.filter((sub: any) => sub.status === 'SUBMITTED').length;
    const totalViews = creatorStories.reduce(
      (acc: number, s: any) => acc + (Number(s.viewCount) || 0),
      0,
    );

    return {
      registered: true,
      creator: creatorProfile,
      metrics: {
        totalStories: creatorStories.length,
        publishedStories: publishedCount,
        inReviewSubmissions: inReviewCount,
        totalViews,
        followersCount: creatorProfile.followersCount,
      },
      stories: creatorStories,
      submissions: submissionsResult.items.map((sub: any) => this.mapSubmissionToDto(sub)),
      earningsSummary,
      analyticsOverview,
    };
  }

  /**
   * Get all stories owned by authenticated creator
   */
  async getMyStories(userId: string): Promise<any[]> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      return [];
    }
    return this.creatorsRepo.findStoriesByCreatorId(creator.id);
  }

  /**
   * Submit an application to become a verified ShortReel creator
   */
  async submitApplication(
    userId: string,
    dto: SubmitCreatorApplicationDto,
  ): Promise<CreatorApplicationResponseDto> {
    // Check if user is already an active creator
    const existingCreator = await this.creatorsRepo.findByUserId(userId);
    if (
      existingCreator &&
      (existingCreator.status === 'ACTIVE' ||
        existingCreator.status === 'APPROVED' ||
        existingCreator.status === 'VERIFIED')
    ) {
      throw new ConflictException('You are already an approved creator on ShortReel');
    }

    // Check if user already has an active pending or under_review application
    const existingActiveApp = await this.applicationsRepo.findActiveByUserId(userId);
    if (existingActiveApp) {
      throw new ConflictException(
        'You already have a creator application pending or under review',
      );
    }

    const application = await this.applicationsRepo.create({
      userId,
      applicantName: dto.applicantName,
      creatorName: dto.creatorName,
      category: dto.category,
      genres: dto.genres,
      languages: dto.languages,
      bio: dto.bio,
      location: dto.location,
      experience: dto.experience,
      portfolioUrl: dto.portfolioUrl,
      proposedStory: dto.proposedStory,
    });

    return this.mapApplicationToDto(application);
  }

  /**
   * List creator applications submitted by authenticated user
   */
  async getMyApplications(userId: string): Promise<CreatorApplicationResponseDto[]> {
    const list = await this.applicationsRepo.findByUserId(userId);
    return list.map((app) => this.mapApplicationToDto(app));
  }

  /**
   * Admin: List applications with optional status filter
   */
  async getAdminApplications(options: {
    status?: ApplicationStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CreatorApplicationResponseDto[]; total: number }> {
    const { items, total } = await this.applicationsRepo.findAll(options);
    return {
      items: items.map((app) => this.mapApplicationToDto(app)),
      total,
    };
  }

  /**
   * Admin / Creator: View specific application by ID
   */
  async getApplicationById(id: string): Promise<CreatorApplicationResponseDto> {
    const application = await this.applicationsRepo.findById(id);
    if (!application) {
      throw new NotFoundException(`Application with ID '${id}' not found`);
    }

    return this.mapApplicationToDto(application);
  }

  /**
   * Admin review application lifecycle (APPROVE, REJECT, CHANGES_REQUESTED, UNDER_REVIEW)
   * Approving automatically elevates user to CREATOR role (ADR-002 Option B / PD-003).
   */
  async reviewApplication(
    id: string,
    reviewerId: string,
    dto: ReviewCreatorApplicationDto,
  ): Promise<CreatorApplicationResponseDto> {
    const application = await this.applicationsRepo.findById(id);
    if (!application) {
      throw new NotFoundException(`Application with ID '${id}' not found`);
    }

    const db = this.dbService.getDb();
    let updatedApp: any;

    if (dto.action === 'UNDER_REVIEW') {
      updatedApp = await this.applicationsRepo.update(id, {
        status: 'UNDER_REVIEW',
        reviewerId,
        reviewerNotes: dto.reviewerNotes || application.reviewerNotes,
      });
    } else if (dto.action === 'CHANGES_REQUESTED') {
      updatedApp = await this.applicationsRepo.update(id, {
        status: 'CHANGES_REQUESTED',
        reviewerId,
        reviewerNotes: dto.reviewerNotes || 'Changes requested by reviewer',
      });
    } else if (dto.action === 'REJECT') {
      updatedApp = await this.applicationsRepo.update(id, {
        status: 'REJECTED',
        reviewerId,
        reviewerNotes: dto.reviewerNotes || 'Application rejected',
        reviewedAt: new Date(),
      });
    } else if (dto.action === 'APPROVE') {
      await db.transaction(async (tx) => {
        // 1. Mark application approved
        updatedApp = await this.applicationsRepo.update(
          id,
          {
            status: 'APPROVED',
            reviewerId,
            reviewerNotes: dto.reviewerNotes || 'Application approved by creator manager',
            reviewedAt: new Date(),
          },
          tx,
        );

        // 2. Create or activate creator record
        let creator = await this.creatorsRepo.findByUserId(application.userId);
        if (creator) {
          creator = await this.creatorsRepo.update(
            creator.id,
            {
              displayName: application.creatorName,
              status: 'ACTIVE',
              bio: application.bio || creator.bio,
            },
            tx,
          );
        } else {
          creator = await this.creatorsRepo.create(
            {
              userId: application.userId,
              displayName: application.creatorName,
              bio: application.bio,
              tier: 'EMERGING',
              status: 'ACTIVE',
            },
            tx,
          );
        }

        // 3. Upsert creator profile
        await this.creatorsRepo.upsertProfile(
          creator.id,
          {
            bio: application.bio || undefined,
            category: application.category,
            genres: application.genres || undefined,
            languages: application.languages || undefined,
            location: application.location || undefined,
            experience: application.experience || undefined,
            portfolioUrl: application.portfolioUrl || undefined,
          },
          tx,
        );

        // 4. Role elevation: Assign CREATOR role to user in user_roles table (PD-003 / ADR-002)
        const creatorRole = await tx
          .select()
          .from(roles)
          .where(eq(roles.name, 'CREATOR'))
          .limit(1);

        if (creatorRole && creatorRole.length > 0) {
          const roleId = creatorRole[0]!.id;
          const existingUserRole = await tx
            .select()
            .from(userRoles)
            .where(
              and(
                eq(userRoles.userId, application.userId),
                eq(userRoles.roleId, roleId),
              ),
            )
            .limit(1);

          if (!existingUserRole || existingUserRole.length === 0) {
            await tx.insert(userRoles).values({
              userId: application.userId,
              roleId,
              grantedBy: reviewerId,
            });
          }
        }
      });

      // 5. Notify user if notification engine is active
      if (this.notificationsService) {
        await this.notificationsService
          .dispatchNotification(application.userId, {
            type: 'CREATOR_APPROVED',
            title: 'Welcome to ShortReel Creator Studio! 🎬',
            body: `Congratulations! Your creator application for "${application.creatorName}" has been approved. You now have access to Creator Studio tools.`,
            data: { creatorName: application.creatorName },
            channels: ['IN_APP', 'PUSH'],
          })
          .catch(() => {});
      }
    }

    return this.mapApplicationToDto(updatedApp);
  }

  /**
   * Submit KYC / Verification documentation
   */
  async submitVerification(
    userId: string,
    dto: SubmitCreatorVerificationDto,
  ): Promise<CreatorVerificationResponseDto> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      throw new NotFoundException('User is not registered as a creator');
    }

    const verification = await this.verificationsRepo.create({
      creatorId: creator.id,
      documentType: dto.documentType,
      documentUrl: dto.documentUrl,
    });

    return {
      id: verification.id,
      creatorId: verification.creatorId,
      status: verification.status,
      documentType: verification.documentType,
      documentUrl: verification.documentUrl,
      verifiedBy: verification.verifiedBy,
      reviewerNotes: verification.reviewerNotes,
      verifiedAt: verification.verifiedAt,
      createdAt: verification.createdAt,
    };
  }

  /**
   * Admin review verification request
   */
  async reviewVerification(
    verificationId: string,
    reviewerId: string,
    dto: ReviewCreatorVerificationDto,
  ): Promise<CreatorVerificationResponseDto> {
    const verification = await this.verificationsRepo.findById(verificationId);
    if (!verification) {
      throw new NotFoundException(`Verification with ID '${verificationId}' not found`);
    }

    const db = this.dbService.getDb();
    let updatedVerif: any;

    await db.transaction(async (tx) => {
      const isApproved = dto.status === 'VERIFIED';

      updatedVerif = await this.verificationsRepo.update(
        verificationId,
        {
          status: dto.status,
          verifiedBy: reviewerId,
          reviewerNotes: dto.reviewerNotes || null,
          verifiedAt: isApproved ? new Date() : null,
        },
        tx,
      );

      if (isApproved) {
        await this.creatorsRepo.update(
          verification.creatorId,
          {
            status: 'VERIFIED',
            tier: 'VERIFIED',
            verifiedAt: new Date(),
          },
          tx,
        );
      }
    });

    return {
      id: updatedVerif.id,
      creatorId: updatedVerif.creatorId,
      status: updatedVerif.status,
      documentType: updatedVerif.documentType,
      documentUrl: updatedVerif.documentUrl,
      verifiedBy: updatedVerif.verifiedBy,
      reviewerNotes: updatedVerif.reviewerNotes,
      verifiedAt: updatedVerif.verifiedAt,
      createdAt: updatedVerif.createdAt,
    };
  }

  /**
   * Admin update creator lifecycle status (ACTIVE, SUSPENDED, DEACTIVATED)
   */
  async updateCreatorStatus(
    creatorId: string,
    dto: UpdateCreatorStatusDto,
  ): Promise<CreatorResponseDto> {
    const creator = await this.creatorsRepo.findById(creatorId);
    if (!creator) {
      throw new NotFoundException(`Creator with ID '${creatorId}' not found`);
    }

    const isSuspending = dto.status === 'SUSPENDED';

    await this.creatorsRepo.update(creatorId, {
      status: dto.status,
      suspensionReason: isSuspending ? dto.suspensionReason || 'Account suspended by moderation team' : null,
      suspensionDate: isSuspending ? new Date() : null,
    });

    return this.getCreatorById(creatorId);
  }

  /**
   * Admin update creator tier (EMERGING, VERIFIED, EXCLUSIVE, PARTNER)
   */
  async updateCreatorTier(
    creatorId: string,
    dto: UpdateCreatorTierDto,
  ): Promise<CreatorResponseDto> {
    const creator = await this.creatorsRepo.findById(creatorId);
    if (!creator) {
      throw new NotFoundException(`Creator with ID '${creatorId}' not found`);
    }

    await this.creatorsRepo.update(creatorId, {
      tier: dto.tier,
    });

    return this.getCreatorById(creatorId);
  }

  /**
   * Admin add internal operational note
   */
  async addInternalNote(
    creatorId: string,
    authorId: string,
    dto: CreateCreatorInternalNoteDto,
  ): Promise<CreatorInternalNoteDto> {
    const creator = await this.creatorsRepo.findById(creatorId);
    if (!creator) {
      throw new NotFoundException(`Creator with ID '${creatorId}' not found`);
    }

    const note = await this.notesRepo.create(creatorId, authorId, dto.note);

    return {
      id: note.id,
      creatorId: note.creatorId,
      authorId: note.authorId,
      note: note.note,
      createdAt: note.createdAt,
    };
  }

  /**
   * Admin get internal notes for a creator
   */
  async getInternalNotes(creatorId: string): Promise<CreatorInternalNoteDto[]> {
    const creator = await this.creatorsRepo.findById(creatorId);
    if (!creator) {
      throw new NotFoundException(`Creator with ID '${creatorId}' not found`);
    }

    const rows = await this.notesRepo.findByCreatorId(creatorId);
    return rows.map((r) => ({
      id: r.note.id,
      creatorId: r.note.creatorId,
      authorId: r.note.authorId,
      authorName: r.authorName,
      note: r.note.note,
      createdAt: r.note.createdAt,
    }));
  }

  // =========================================================================
  // CREATOR SUBMISSIONS WORKFLOW (M17)
  // =========================================================================

  /**
   * Creator create draft or initial submission pitch
   */
  async createSubmission(
    userId: string,
    dto: CreateSubmissionDto,
  ): Promise<CreatorSubmissionResponseDto> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      throw new NotFoundException('Authenticated user is not registered as a creator');
    }

    if (
      creator.status === 'SUSPENDED' ||
      creator.status === 'DEACTIVATED' ||
      creator.status === 'REJECTED'
    ) {
      throw new ForbiddenException(
        `Creator account is ${creator.status.toLowerCase()} and cannot create submissions`,
      );
    }

    const created = await this.submissionsRepo.create({
      creatorId: creator.id,
      title: dto.title,
      synopsis: dto.synopsis,
      submissionType: dto.submissionType,
      storyId: dto.storyId,
      storyVersionId: dto.storyVersionId,
      scriptUrl: dto.scriptUrl,
      videoPreviewUrl: dto.videoPreviewUrl,
      status: 'DRAFT',
      storyInfo: dto.storyInfo,
      contentPreview: dto.contentPreview,
      checklist: dto.checklist,
    });

    const refreshed = await this.submissionsRepo.findById(created.id);
    return this.mapSubmissionToDto(refreshed || created);
  }

  /**
   * Creator list their own submissions with optional filters and pagination
   */
  async getMySubmissions(
    userId: string,
    query: SubmissionQueryDto,
  ): Promise<PaginatedSubmissionsDto> {
    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator) {
      throw new NotFoundException('Authenticated user is not registered as a creator');
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const { items, total } = await this.submissionsRepo.findByCreatorId(creator.id, {
      status: query.status,
      submissionType: query.submissionType,
      limit,
      offset,
    });

    return {
      items: items.map((sub) => this.mapSubmissionToDto(sub)),
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get single submission by ID (ownership asserted unless admin)
   */
  async getSubmissionById(
    submissionId: string,
    userId?: string,
    isAdmin = false,
  ): Promise<CreatorSubmissionResponseDto> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) {
      throw new NotFoundException(`Submission with ID '${submissionId}' not found`);
    }

    if (!isAdmin && userId) {
      const creator = await this.creatorsRepo.findByUserId(userId);
      if (!creator || creator.id !== submission.creatorId) {
        throw new ForbiddenException('Forbidden: You can only view your own submissions');
      }
    }

    return this.mapSubmissionToDto(submission);
  }

  /**
   * Creator update submission details (only permitted in DRAFT or CHANGES_REQUESTED status)
   */
  async updateSubmission(
    userId: string,
    submissionId: string,
    dto: UpdateSubmissionDto,
  ): Promise<CreatorSubmissionResponseDto> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) {
      throw new NotFoundException(`Submission with ID '${submissionId}' not found`);
    }

    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator || creator.id !== submission.creatorId) {
      throw new ForbiddenException('Forbidden: You can only edit your own submissions');
    }

    if (submission.status !== 'DRAFT' && submission.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException(
        `Only submissions in 'DRAFT' or 'CHANGES_REQUESTED' status can be modified (current: '${submission.status}')`,
      );
    }

    const updated = await this.submissionsRepo.update(submissionId, {
      ...(dto.title && { title: dto.title }),
      ...(dto.synopsis !== undefined && { synopsis: dto.synopsis }),
      ...(dto.submissionType && { submissionType: dto.submissionType }),
      ...(dto.storyId !== undefined && { storyId: dto.storyId }),
      ...(dto.storyVersionId !== undefined && { storyVersionId: dto.storyVersionId }),
      ...(dto.scriptUrl !== undefined && { scriptUrl: dto.scriptUrl }),
      ...(dto.videoPreviewUrl !== undefined && { videoPreviewUrl: dto.videoPreviewUrl }),
      ...(dto.storyInfo !== undefined && { storyInfo: dto.storyInfo }),
      ...(dto.contentPreview !== undefined && { contentPreview: dto.contentPreview }),
      ...(dto.checklist !== undefined && { checklist: dto.checklist }),
    });

    return this.mapSubmissionToDto(updated);
  }

  /**
   * Creator submit submission for editorial review (DRAFT | CHANGES_REQUESTED -> SUBMITTED)
   */
  async submitSubmission(
    userId: string,
    submissionId: string,
  ): Promise<CreatorSubmissionResponseDto> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) {
      throw new NotFoundException(`Submission with ID '${submissionId}' not found`);
    }

    const creator = await this.creatorsRepo.findByUserId(userId);
    if (!creator || creator.id !== submission.creatorId) {
      throw new ForbiddenException('Forbidden: You can only submit your own submissions');
    }

    if (submission.status !== 'DRAFT' && submission.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException(
        `Submission cannot be submitted from current status: '${submission.status}'. Allowed: 'DRAFT', 'CHANGES_REQUESTED'`,
      );
    }

    const updated = await this.submissionsRepo.update(submissionId, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    // If linked to an interactive story version, sync version status to IN_REVIEW
    if (submission.storyVersionId) {
      await this.dbService
        .getDb()
        .update(storyVersions)
        .set({ status: 'IN_REVIEW', updatedAt: new Date() })
        .where(eq(storyVersions.id, submission.storyVersionId));
    }

    this.logger.log(`Submission '${submissionId}' submitted for review by creator '${creator.id}'`);

    return this.mapSubmissionToDto(updated);
  }

  /**
   * Admin view review queue with filtering and pagination
   */
  async getAdminSubmissions(query: SubmissionQueryDto): Promise<PaginatedSubmissionsDto> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const { items, total } = await this.submissionsRepo.findAll({
      status: query.status,
      submissionType: query.submissionType,
      creatorId: query.creatorId,
      search: query.search,
      limit,
      offset,
    });

    return {
      items: items.map((sub) => this.mapSubmissionToDto(sub)),
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Admin / Editorial review submission workflow (UNDER_REVIEW, CHANGES_REQUESTED, APPROVED, REJECTED, PUBLISHED)
   */
  async reviewSubmission(
    reviewerId: string,
    submissionId: string,
    dto: ReviewSubmissionDto,
  ): Promise<CreatorSubmissionResponseDto> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) {
      throw new NotFoundException(`Submission with ID '${submissionId}' not found`);
    }

    const db = this.dbService.getDb();
    let updatedSub: any;

    await db.transaction(async (tx) => {
      const updates: Partial<CreatorSubmission> = {
        status: dto.action,
        reviewerId,
        reviewedAt: new Date(),
      };

      if (dto.reviewerNotes !== undefined) {
        updates.reviewerNotes = dto.reviewerNotes;
      }
      if (dto.checklist !== undefined) {
        updates.checklist = dto.checklist;
      }

      updatedSub = await this.submissionsRepo.update(submissionId, updates, tx);

      // Story Version synchronization
      if (submission.storyVersionId) {
        if (dto.action === 'APPROVED') {
          await tx
            .update(storyVersions)
            .set({ status: 'APPROVED', updatedAt: new Date() })
            .where(eq(storyVersions.id, submission.storyVersionId));
        } else if (dto.action === 'CHANGES_REQUESTED' || dto.action === 'REJECTED') {
          await tx
            .update(storyVersions)
            .set({ status: 'DRAFT', updatedAt: new Date() })
            .where(eq(storyVersions.id, submission.storyVersionId));
        } else if (dto.action === 'PUBLISHED') {
          await tx
            .update(storyVersions)
            .set({ status: 'PUBLISHED', publishedAt: new Date(), updatedAt: new Date() })
            .where(eq(storyVersions.id, submission.storyVersionId));

          if (submission.storyId) {
            await tx
              .update(stories)
              .set({ status: 'PUBLISHED', updatedAt: new Date() })
              .where(eq(stories.id, submission.storyId));
          }
        }
      }
    });

    // Notify creator of status change
    const creator = await this.creatorsRepo.findById(submission.creatorId);
    if (creator && this.notificationsService) {
      await this.notificationsService
        .dispatchNotification(creator.userId, {
          type: 'SUBMISSION_STATUS_CHANGED',
          title: `Submission Update: ${submission.title}`,
          body: `Your submission "${submission.title}" status changed to ${dto.action}.${
            dto.reviewerNotes ? ' Editorial note: ' + dto.reviewerNotes : ''
          }`,
          data: {
            submissionId,
            status: dto.action,
            reviewerNotes: dto.reviewerNotes || null,
          },
          channels: ['IN_APP', 'PUSH'],
        })
        .catch(() => {});
    }

    return this.mapSubmissionToDto(updatedSub);
  }

  // --- Helper Mappings ---

  private mapApplicationToDto(app: any): CreatorApplicationResponseDto {
    return {
      id: app.id,
      userId: app.userId,
      applicantName: app.applicantName,
      creatorName: app.creatorName,
      category: app.category,
      genres: Array.isArray(app.genres) ? app.genres : [],
      languages: Array.isArray(app.languages) ? app.languages : [],
      bio: app.bio,
      location: app.location,
      experience: app.experience,
      portfolioUrl: app.portfolioUrl,
      proposedStory: app.proposedStory,
      status: app.status,
      reviewerId: app.reviewerId,
      reviewerNotes: app.reviewerNotes,
      reviewedAt: app.reviewedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private mapSubmissionToDto(sub: any): CreatorSubmissionResponseDto {
    return {
      id: sub.id,
      creatorId: sub.creatorId,
      creatorName: sub.creatorName,
      storyId: sub.storyId,
      storyVersionId: sub.storyVersionId,
      submissionType: sub.submissionType,
      title: sub.title,
      synopsis: sub.synopsis,
      scriptUrl: sub.scriptUrl,
      videoPreviewUrl: sub.videoPreviewUrl,
      status: sub.status,
      storyInfo: sub.storyInfo,
      contentPreview: sub.contentPreview,
      checklist: sub.checklist,
      reviewerId: sub.reviewerId,
      reviewerName: sub.reviewerName,
      reviewerNotes: sub.reviewerNotes,
      reviewedAt: sub.reviewedAt,
      submittedAt: sub.submittedAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}
