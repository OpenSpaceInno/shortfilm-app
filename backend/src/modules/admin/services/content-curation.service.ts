import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { FeaturedCurationsRepository } from '../repositories/featured-curations.repository';
import { AuditService } from './audit.service';
import {
  QueryAdminStoriesDto,
  AdminStoryResponseDto,
  CurateStoryDto,
  AdminArchiveStoryDto,
  AdminUnpublishStoryDto,
  AdminOverrideMetadataDto,
  CreateCurationDto,
  UpdateCurationDto,
  FeaturedCurationResponseDto,
} from '../dto/content-curation.dto';
import { CurationCollectionType } from '../../../database/schema/admin.schema';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@Injectable()
export class ContentCurationService {
  private readonly logger = new Logger(ContentCurationService.name);

  constructor(
    private readonly contentRepo: AdminContentRepository,
    private readonly curationsRepo: FeaturedCurationsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getStories(
    query: QueryAdminStoriesDto,
  ): Promise<{ items: AdminStoryResponseDto[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.contentRepo.findStoriesPaginated(query);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getStoryDetail(id: string) {
    const story = await this.contentRepo.findStoryDetail(id);
    if (!story) {
      throw new NotFoundException(`Story with ID '${id}' not found`);
    }
    return story;
  }

  async curateStory(
    storyId: string,
    dto: CurateStoryDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const story = await this.contentRepo.findStoryDetail(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const previousState = { isFeatured: story.isFeatured };

    if (dto.isFeatured !== undefined) {
      const targetCollection = dto.collectionType || 'EDITOR_PICK';
      const existing = await this.curationsRepo.findByStoryAndCollection(storyId, targetCollection);

      if (dto.isFeatured) {
        if (!existing) {
          await this.curationsRepo.create({
            storyId,
            collectionType: targetCollection,
            displayOrder: dto.displayOrder ?? 0,
            badge: dto.badge,
            customHeadline: dto.customHeadline,
            curatedBy: user.id,
          });
        } else {
          await this.curationsRepo.update(existing.id, {
            isActive: true,
            displayOrder: dto.displayOrder,
            badge: dto.badge,
            customHeadline: dto.customHeadline,
          });
        }
      } else {
        if (existing) {
          await this.curationsRepo.update(existing.id, { isActive: false });
        }
      }
    }

    const updated = await this.contentRepo.findStoryDetail(storyId);

    await this.auditService.log({
      actor: user,
      action: 'STORY_CURATION_UPDATED',
      entityType: 'STORY',
      entityId: storyId,
      previousState,
      newState: { isFeatured: updated?.isFeatured, dto },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return updated;
  }

  async archiveStory(
    storyId: string,
    dto: AdminArchiveStoryDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const story = await this.contentRepo.findStoryDetail(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const previousState = { status: story.status };
    const updated = await this.contentRepo.updateStatus(storyId, 'ARCHIVED');

    await this.auditService.log({
      actor: user,
      action: 'STORY_ARCHIVED',
      entityType: 'STORY',
      entityId: storyId,
      previousState,
      newState: { status: 'ARCHIVED', reason: dto.reason },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return {
      success: true,
      message: `Story '${story.title}' successfully archived`,
      story: updated,
    };
  }

  async unpublishStory(
    storyId: string,
    dto: AdminUnpublishStoryDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const story = await this.contentRepo.findStoryDetail(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const previousState = { status: story.status };
    const updated = await this.contentRepo.updateStatus(storyId, 'DRAFT');

    await this.auditService.log({
      actor: user,
      action: 'STORY_UNPUBLISHED',
      entityType: 'STORY',
      entityId: storyId,
      previousState,
      newState: { status: 'DRAFT', reason: dto.reason },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return {
      success: true,
      message: `Story '${story.title}' unpublished and reverted to DRAFT`,
      story: updated,
    };
  }

  async overrideMetadata(
    storyId: string,
    dto: AdminOverrideMetadataDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const story = await this.contentRepo.findStoryDetail(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    const previousState = {
      title: story.title,
      synopsis: story.synopsis,
      contentRating: story.contentRating,
      language: story.language,
    };

    const updated = await this.contentRepo.updateMetadata(storyId, dto);

    await this.auditService.log({
      actor: user,
      action: 'STORY_METADATA_OVERRIDDEN',
      entityType: 'STORY',
      entityId: storyId,
      previousState,
      newState: dto,
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return updated;
  }

  async listCurations(
    collectionType?: CurationCollectionType,
  ): Promise<FeaturedCurationResponseDto[]> {
    const curations = await this.curationsRepo.findMany({ collectionType });
    return curations.map((c) => ({
      id: c.id,
      storyId: c.storyId,
      storyTitle: c.storyTitle,
      storyThumbnailUrl: c.storyThumbnailUrl,
      collectionType: c.collectionType,
      displayOrder: c.displayOrder,
      badge: c.badge,
      customHeadline: c.customHeadline,
      isActive: c.isActive,
      startsAt: c.startsAt?.toISOString(),
      endsAt: c.endsAt?.toISOString(),
      curatedBy: c.curatedBy,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createCuration(
    dto: CreateCurationDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<FeaturedCurationResponseDto> {
    const story = await this.contentRepo.findStoryDetail(dto.storyId);
    if (!story) {
      throw new NotFoundException(`Story '${dto.storyId}' not found`);
    }

    const created = await this.curationsRepo.create({
      storyId: dto.storyId,
      collectionType: dto.collectionType,
      displayOrder: dto.displayOrder,
      badge: dto.badge,
      customHeadline: dto.customHeadline,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      curatedBy: user.id,
    });

    await this.auditService.log({
      actor: user,
      action: 'FEATURED_CURATION_CREATED',
      entityType: 'FEATURED_CURATION',
      entityId: created.id,
      previousState: null,
      newState: dto,
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return {
      id: created.id,
      storyId: created.storyId,
      storyTitle: story.title,
      storyThumbnailUrl: story.thumbnailUrl,
      collectionType: created.collectionType,
      displayOrder: created.displayOrder,
      badge: created.badge,
      customHeadline: created.customHeadline,
      isActive: created.isActive,
      startsAt: created.startsAt?.toISOString(),
      endsAt: created.endsAt?.toISOString(),
      curatedBy: created.curatedBy,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateCuration(
    id: string,
    dto: UpdateCurationDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<FeaturedCurationResponseDto> {
    const existing = await this.curationsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Curation '${id}' not found`);
    }

    const previousState = { ...existing };
    const updated = await this.curationsRepo.update(id, {
      displayOrder: dto.displayOrder,
      badge: dto.badge,
      customHeadline: dto.customHeadline,
      isActive: dto.isActive,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
    });

    await this.auditService.log({
      actor: user,
      action: 'FEATURED_CURATION_UPDATED',
      entityType: 'FEATURED_CURATION',
      entityId: id,
      previousState,
      newState: dto,
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    const refreshed = await this.curationsRepo.findById(id);
    return {
      id: refreshed!.id,
      storyId: refreshed!.storyId,
      collectionType: refreshed!.collectionType,
      displayOrder: refreshed!.displayOrder,
      badge: refreshed!.badge,
      customHeadline: refreshed!.customHeadline,
      isActive: refreshed!.isActive,
      startsAt: refreshed!.startsAt?.toISOString(),
      endsAt: refreshed!.endsAt?.toISOString(),
      curatedBy: refreshed!.curatedBy,
      createdAt: refreshed!.createdAt.toISOString(),
      updatedAt: refreshed!.updatedAt.toISOString(),
    };
  }

  async deleteCuration(
    id: string,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.curationsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Curation '${id}' not found`);
    }

    await this.curationsRepo.delete(id);

    await this.auditService.log({
      actor: user,
      action: 'FEATURED_CURATION_DELETED',
      entityType: 'FEATURED_CURATION',
      entityId: id,
      previousState: existing,
      newState: null,
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return { success: true, message: 'Featured curation removed' };
  }
}
