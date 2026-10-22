import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';
import { VideosRepository } from '../../videos/repositories/videos.repository';
import { DagValidatorService } from './dag-validator.service';
import { InteractiveService } from './interactive.service';
import { RejectVersionDto, VersionTransitionResponseDto } from '../dto/lifecycle.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { StoryVersion } from '../../../database/schema';

@Injectable()
export class StoryLifecycleService {
  private readonly logger = new Logger(StoryLifecycleService.name);

  constructor(
    private readonly storyVersionsRepository: StoryVersionsRepository,
    private readonly storyNodesRepository: StoryNodesRepository,
    private readonly storiesRepository: StoriesRepository,
    private readonly creatorsRepository: CreatorsRepository,
    private readonly videosRepository: VideosRepository,
    private readonly dagValidatorService: DagValidatorService,
    private readonly interactiveService: InteractiveService,
  ) {}

  /**
   * Submit draft version for review (DRAFT -> IN_REVIEW)
   */
  async submitForReview(
    user: AuthenticatedUser,
    versionId: string,
  ): Promise<VersionTransitionResponseDto> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    if (version.status !== 'DRAFT') {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: Version must be in 'DRAFT' status to submit for review (current: '${version.status}')`,
      );
    }

    // Graph validation pre-check
    const validation = await this.dagValidatorService.validate(versionId);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'GRAPH_VALIDATION_FAILED: Story graph has validation errors and cannot be submitted for review',
        errors: validation.errors,
      });
    }

    const updated = await this.storyVersionsRepository.update(versionId, {
      status: 'IN_REVIEW',
    });

    this.logger.log(`Version '${versionId}' submitted for review by user '${user.id}'`);

    return this.toTransitionDto(version, updated);
  }

  /**
   * Approve version in review (IN_REVIEW -> APPROVED) - Admin Only
   */
  async approveVersion(
    user: AuthenticatedUser,
    versionId: string,
  ): Promise<VersionTransitionResponseDto> {
    this.assertAdmin(user);

    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    if (version.status !== 'IN_REVIEW') {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: Version must be in 'IN_REVIEW' status to approve (current: '${version.status}')`,
      );
    }

    const updated = await this.storyVersionsRepository.update(versionId, {
      status: 'APPROVED',
    });

    this.logger.log(`Version '${versionId}' approved by admin '${user.id}'`);

    return this.toTransitionDto(version, updated);
  }

  /**
   * Reject / request changes on a version (IN_REVIEW | APPROVED -> DRAFT) - Admin Only
   */
  async rejectVersion(
    user: AuthenticatedUser,
    versionId: string,
    dto?: RejectVersionDto,
  ): Promise<VersionTransitionResponseDto> {
    this.assertAdmin(user);

    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    if (version.status !== 'IN_REVIEW' && version.status !== 'APPROVED') {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: Version must be in 'IN_REVIEW' or 'APPROVED' status to request changes (current: '${version.status}')`,
      );
    }

    const updated = await this.storyVersionsRepository.update(versionId, {
      status: 'DRAFT',
    });

    this.logger.log(
      `Version '${versionId}' changes requested by admin '${user.id}'. Reason: ${dto?.reason || 'None provided'}`,
    );

    return this.toTransitionDto(version, updated);
  }

  /**
   * Publish version (APPROVED -> PUBLISHED)
   * Enforces DAG validation, Invariant ENG-009 (Video READY), and single-published invariant.
   */
  async publishVersion(
    user: AuthenticatedUser,
    versionId: string,
  ): Promise<VersionTransitionResponseDto> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    const isAdmin = this.checkIsAdmin(user);
    if (!isAdmin && version.status !== 'APPROVED') {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: Version must be in 'APPROVED' status before publishing (current: '${version.status}'). Please submit for review.`,
      );
    }

    if (version.status === 'PUBLISHED') {
      throw new BadRequestException('Story version is already published');
    }

    if (version.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot publish an archived story version');
    }

    // 1. DAG Invariants Validation
    const validation = await this.dagValidatorService.validate(versionId);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'GRAPH_VALIDATION_FAILED: Graph validation failed before publishing',
        errors: validation.errors,
      });
    }

    // 2. Invariant ENG-009: Video readiness check for all nodes
    const nodes = await this.storyNodesRepository.findByVersionId(versionId);
    for (const node of nodes) {
      const video = await this.videosRepository.findByEpisodeId(node.episodeId);
      if (!video || video.status !== 'READY') {
        throw new BadRequestException(
          `VIDEO_NOT_READY: Episode '${node.episodeId}' video is not READY (status: ${video?.status || 'NO_VIDEO'})`,
        );
      }
    }

    // 3. Single Published Version Invariant: Archive any prior published version for this story
    await this.storyVersionsRepository.archivePublishedForStory(version.storyId, version.id);

    // 4. Denormalized graph snapshot
    const snapshot = await this.interactiveService.getFullGraph(versionId);

    // 5. Update this version to PUBLISHED
    const updated = await this.storyVersionsRepository.update(versionId, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      graphSnapshot: snapshot,
    });

    // 6. Ensure parent story is marked PUBLISHED
    if (story && story.status !== 'PUBLISHED') {
      await this.storiesRepository.update(story.id, { status: 'PUBLISHED' });
    }

    this.logger.log(
      `Story version '${versionId}' (v${version.versionNumber}) published for story '${version.storyId}'`,
    );

    return this.toTransitionDto(version, updated);
  }

  /**
   * Archive version (PUBLISHED -> ARCHIVED)
   */
  async archiveVersion(
    user: AuthenticatedUser,
    versionId: string,
  ): Promise<VersionTransitionResponseDto> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    if (version.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: Only 'PUBLISHED' story versions can be archived (current: '${version.status}')`,
      );
    }

    const updated = await this.storyVersionsRepository.update(versionId, {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    });

    this.logger.log(`Story version '${versionId}' archived by user '${user.id}'`);

    return this.toTransitionDto(version, updated);
  }

  /**
   * Get list of versions currently in review (Admin review queue)
   */
  async getReviewQueue(user: AuthenticatedUser): Promise<StoryVersion[]> {
    this.assertAdmin(user);
    return this.storyVersionsRepository.findByStatus('IN_REVIEW');
  }

  private toTransitionDto(
    previous: StoryVersion,
    current: StoryVersion,
  ): VersionTransitionResponseDto {
    return {
      versionId: current.id,
      storyId: current.storyId,
      versionNumber: current.versionNumber,
      previousStatus: previous.status,
      newStatus: current.status,
      updatedAt: current.updatedAt,
      publishedAt: current.publishedAt,
      archivedAt: current.archivedAt,
    };
  }

  private checkIsAdmin(user: AuthenticatedUser): boolean {
    return !!(
      user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('CONTENT_ADMIN')
    );
  }

  private assertAdmin(user: AuthenticatedUser): void {
    if (!this.checkIsAdmin(user)) {
      throw new ForbiddenException(
        'Forbidden: Operation requires SUPER_ADMIN or CONTENT_ADMIN role',
      );
    }
  }

  private async assertStoryOwnership(
    user: AuthenticatedUser,
    creatorId: string,
  ): Promise<void> {
    if (this.checkIsAdmin(user)) return;

    const creator = await this.creatorsRepository.findByUserId(user.id);
    if (!creator || creator.id !== creatorId) {
      throw new ForbiddenException(
        'Forbidden: You can only manage lifecycle for story versions you own',
      );
    }
  }
}
