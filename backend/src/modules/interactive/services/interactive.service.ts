import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { VideosRepository } from '../../videos/repositories/videos.repository';
import { DagValidatorService } from './dag-validator.service';
import { CreateStoryNodeDto, UpdateStoryNodeDto } from '../dto/create-node.dto';
import { CreateChoiceDto, CreateChoiceOptionDto } from '../dto/create-choice.dto';
import { StoryGraphDto, GraphNodeDto, GraphEdgeDto } from '../dto/graph-response.dto';
import { GraphValidationResultDto } from '../dto/validation-result.dto';
import { generateUlid } from '../../../database/utils/ulid.util';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { StoryVersion } from '../../../database/schema';

@Injectable()
export class InteractiveService {
  constructor(
    private readonly storyVersionsRepository: StoryVersionsRepository,
    private readonly storyNodesRepository: StoryNodesRepository,
    private readonly choicesRepository: ChoicesRepository,
    private readonly choiceOptionsRepository: ChoiceOptionsRepository,
    private readonly storiesRepository: StoriesRepository,
    private readonly creatorsRepository: CreatorsRepository,
    private readonly episodesRepository: EpisodesRepository,
    private readonly videosRepository: VideosRepository,
    private readonly dagValidatorService: DagValidatorService,
  ) {}

  async getStoryVersions(storyId: string): Promise<StoryVersion[]> {
    const story = await this.storiesRepository.findById(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    return this.storyVersionsRepository.findByStoryId(storyId);
  }

  async getVersionById(versionId: string): Promise<StoryVersion> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }
    return version;
  }

  async createVersion(user: AuthenticatedUser, storyId: string): Promise<StoryVersion> {
    const story = await this.storiesRepository.findById(storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${storyId}' not found`);
    }

    await this.assertStoryOwnership(user, story.creatorId);

    const latest = await this.storyVersionsRepository.findLatestVersion(storyId);
    const versionNumber = (latest?.versionNumber || 0) + 1;

    return this.storyVersionsRepository.create({
      id: generateUlid(),
      storyId,
      versionNumber,
      status: 'DRAFT',
    });
  }

  async getFullGraph(versionId: string): Promise<StoryGraphDto> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    const nodes = await this.storyNodesRepository.findByVersionId(versionId);
    const graphNodes: GraphNodeDto[] = [];
    const graphEdges: GraphEdgeDto[] = [];

    for (const node of nodes) {
      const episode = await this.episodesRepository.findById(node.episodeId);
      const choice = await this.choicesRepository.findByNodeId(node.id);

      let choiceDto: any = null;
      if (choice) {
        const options = await this.choiceOptionsRepository.findByChoiceId(choice.id);
        choiceDto = {
          id: choice.id,
          prompt: choice.prompt,
          votingOpensAt: choice.votingOpensAt,
          votingEndsAt: choice.votingEndsAt,
          options: options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            destinationNodeId: opt.destinationNodeId,
            voteCount: opt.voteCount,
            displayOrder: opt.displayOrder,
          })),
        };

        options.forEach((opt) => {
          graphEdges.push({
            sourceNodeId: node.id,
            destinationNodeId: opt.destinationNodeId,
            choiceId: choice.id,
            optionId: opt.id,
            label: opt.label,
          });
        });
      }

      graphNodes.push({
        id: node.id,
        episodeId: node.episodeId,
        episodeTitle: episode?.title,
        episodeNumber: episode?.episodeNumber,
        nodeType: node.nodeType,
        isRoot: node.isRoot,
        sequenceOrder: node.sequenceOrder,
        votingEndsAt: node.votingEndsAt,
        fallbackOptionId: node.fallbackOptionId,
        choice: choiceDto,
      });
    }

    return {
      storyId: version.storyId,
      versionId: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      rootNodeId: version.rootNodeId,
      publishedAt: version.publishedAt,
      nodes: graphNodes,
      edges: graphEdges,
    };
  }

  async getPublishedGraphForStory(storyId: string): Promise<StoryGraphDto> {
    const published = await this.storyVersionsRepository.findPublishedVersion(storyId);
    if (!published) {
      throw new NotFoundException(`No published story version found for story '${storyId}'`);
    }

    return this.getFullGraph(published.id);
  }

  async createNode(
    user: AuthenticatedUser,
    versionId: string,
    dto: CreateStoryNodeDto,
  ) {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    this.assertVersionMutable(version);

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    const episode = await this.episodesRepository.findById(dto.episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${dto.episodeId}' not found`);
    }

    const nodeId = generateUlid();
    const createdNode = await this.storyNodesRepository.create({
      id: nodeId,
      storyVersionId: versionId,
      episodeId: dto.episodeId,
      nodeType: dto.nodeType || 'STANDARD',
      isRoot: dto.isRoot || false,
      sequenceOrder: dto.sequenceOrder || 0,
      votingEndsAt: dto.votingEndsAt ? new Date(dto.votingEndsAt) : null,
      fallbackOptionId: dto.fallbackOptionId,
    });

    if (dto.isRoot) {
      await this.storyVersionsRepository.update(versionId, { rootNodeId: nodeId });
    }

    return createdNode;
  }

  async updateNode(
    user: AuthenticatedUser,
    nodeId: string,
    dto: UpdateStoryNodeDto,
  ) {
    const node = await this.storyNodesRepository.findById(nodeId);
    if (!node) {
      throw new NotFoundException(`Story node with ID '${nodeId}' not found`);
    }

    const version = await this.storyVersionsRepository.findById(node.storyVersionId);
    if (!version) throw new NotFoundException('Version not found');

    this.assertVersionMutable(version);

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    const updated = await this.storyNodesRepository.update(nodeId, {
      nodeType: dto.nodeType,
      isRoot: dto.isRoot,
      sequenceOrder: dto.sequenceOrder,
      votingEndsAt: dto.votingEndsAt ? new Date(dto.votingEndsAt) : undefined,
      fallbackOptionId: dto.fallbackOptionId,
    });

    if (dto.isRoot) {
      await this.storyVersionsRepository.update(version.id, { rootNodeId: nodeId });
    }

    return updated;
  }

  async deleteNode(user: AuthenticatedUser, nodeId: string) {
    const node = await this.storyNodesRepository.findById(nodeId);
    if (!node) {
      throw new NotFoundException(`Story node with ID '${nodeId}' not found`);
    }

    const version = await this.storyVersionsRepository.findById(node.storyVersionId);
    if (version) {
      this.assertVersionMutable(version);
      const story = await this.storiesRepository.findById(version.storyId);
      if (story) await this.assertStoryOwnership(user, story.creatorId);
    }

    await this.storyNodesRepository.delete(nodeId);
    return { success: true, message: `Node '${nodeId}' deleted` };
  }

  async addChoiceToNode(
    user: AuthenticatedUser,
    nodeId: string,
    dto: CreateChoiceDto,
  ) {
    const node = await this.storyNodesRepository.findById(nodeId);
    if (!node) {
      throw new NotFoundException(`Story node with ID '${nodeId}' not found`);
    }

    const version = await this.storyVersionsRepository.findById(node.storyVersionId);
    if (version) {
      this.assertVersionMutable(version);
      const story = await this.storiesRepository.findById(version.storyId);
      if (story) await this.assertStoryOwnership(user, story.creatorId);
    }

    // Auto-update node to CHOICE_POINT if standard
    if (node.nodeType === 'STANDARD') {
      await this.storyNodesRepository.update(nodeId, { nodeType: 'CHOICE_POINT' });
    }

    return this.choicesRepository.create({
      id: generateUlid(),
      storyNodeId: nodeId,
      prompt: dto.prompt,
      votingOpensAt: dto.votingOpensAt ? new Date(dto.votingOpensAt) : null,
      votingEndsAt: dto.votingEndsAt ? new Date(dto.votingEndsAt) : null,
    });
  }

  async addChoiceOption(
    user: AuthenticatedUser,
    choiceId: string,
    dto: CreateChoiceOptionDto,
  ) {
    const choice = await this.choicesRepository.findById(choiceId);
    if (!choice) {
      throw new NotFoundException(`Choice with ID '${choiceId}' not found`);
    }

    const node = await this.storyNodesRepository.findById(choice.storyNodeId);
    if (!node) throw new NotFoundException('Node not found');

    const version = await this.storyVersionsRepository.findById(node.storyVersionId);
    if (version) {
      this.assertVersionMutable(version);
      const story = await this.storiesRepository.findById(version.storyId);
      if (story) await this.assertStoryOwnership(user, story.creatorId);
    }

    const destination = await this.storyNodesRepository.findById(dto.destinationNodeId);
    if (!destination) {
      throw new BadRequestException(
        `DESTINATION_NODE_INVALID: Destination node '${dto.destinationNodeId}' not found`,
      );
    }

    return this.choiceOptionsRepository.create({
      id: generateUlid(),
      choiceId,
      label: dto.label,
      destinationNodeId: dto.destinationNodeId,
      displayOrder: dto.displayOrder || 1,
    });
  }

  async validateGraph(versionId: string): Promise<GraphValidationResultDto> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    return this.dagValidatorService.validate(versionId);
  }

  async publishVersion(user: AuthenticatedUser, versionId: string): Promise<StoryVersion> {
    const version = await this.storyVersionsRepository.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Story version with ID '${versionId}' not found`);
    }

    const story = await this.storiesRepository.findById(version.storyId);
    if (story) {
      await this.assertStoryOwnership(user, story.creatorId);
    }

    if (version.status === 'PUBLISHED') {
      throw new BadRequestException('Story version is already published');
    }

    const validation = await this.dagValidatorService.validate(versionId);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'STORY_GRAPH_INVALID: Graph validation failed before publishing',
        errors: validation.errors,
      });
    }

    const nodes = await this.storyNodesRepository.findByVersionId(versionId);
    for (const node of nodes) {
      const video = await this.videosRepository.findByEpisodeId(node.episodeId);
      if (!video || video.status !== 'READY') {
        throw new BadRequestException(
          `VIDEO_NOT_READY: Episode '${node.episodeId}' video is not READY (status: ${video?.status || 'NO_VIDEO'})`,
        );
      }
    }

    const snapshot = await this.getFullGraph(versionId);

    return this.storyVersionsRepository.update(versionId, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      graphSnapshot: snapshot,
    });
  }

  private assertVersionMutable(version: StoryVersion): void {
    if (version.status === 'PUBLISHED' || version.status === 'ARCHIVED') {
      throw new BadRequestException(
        `STORY_VERSION_IMMUTABLE: Version '${version.versionNumber}' is '${version.status}' and cannot be modified`,
      );
    }
  }

  private async assertStoryOwnership(user: AuthenticatedUser, creatorId: string): Promise<void> {
    const isAdmin = user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('CONTENT_ADMIN');
    if (isAdmin) return;

    const creator = await this.creatorsRepository.findByUserId(user.id);
    if (!creator || creator.id !== creatorId) {
      throw new ForbiddenException('Forbidden: You can only modify interactive graphs for stories you own');
    }
  }
}
