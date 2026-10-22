import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';
import { UserChoicesRepository } from '../repositories/user-choices.repository';
import { XpLedgerRepository } from '../repositories/xp-ledger.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { VideosService } from '../../videos/services/videos.service';
import {
  SubmitChoiceDto,
  ChoiceResolutionResponseDto,
  DestinationNodeDto,
} from '../dto/submit-choice.dto';
import { generateUlid } from '../../../database/utils/ulid.util';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { UserChoice } from '../../../database/schema';

@Injectable()
export class ChoiceEngineService {
  private readonly logger = new Logger(ChoiceEngineService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly storyVersionsRepository: StoryVersionsRepository,
    private readonly storyNodesRepository: StoryNodesRepository,
    private readonly choicesRepository: ChoicesRepository,
    private readonly choiceOptionsRepository: ChoiceOptionsRepository,
    private readonly userChoicesRepository: UserChoicesRepository,
    private readonly xpLedgerRepository: XpLedgerRepository,
    private readonly episodesRepository: EpisodesRepository,
    private readonly videosService: VideosService,
  ) {}

  /**
   * Resolve an interactive choice dilemma within an ACID transaction
   */
  async resolveChoice(
    user: AuthenticatedUser,
    dto: SubmitChoiceDto,
  ): Promise<ChoiceResolutionResponseDto> {
    // 1. Version Lookup & Status Check
    const version = await this.storyVersionsRepository.findById(dto.storyVersionId);
    if (!version) {
      throw new NotFoundException(`Story version '${dto.storyVersionId}' not found`);
    }

    // Invariant ENG-005: Access DRAFT version as consumer
    if (version.status !== 'PUBLISHED' && version.status !== 'ARCHIVED') {
      throw new ForbiddenException(
        `STORY_VERSION_NOT_PUBLISHED: Story version '${version.versionNumber}' is '${version.status}' and not open for consumer choices`,
      );
    }

    // Invariant ENG-006: Access ARCHIVED version (read-only)
    if (version.status === 'ARCHIVED') {
      throw new BadRequestException(
        `STORY_VERSION_ARCHIVED: Story version '${version.versionNumber}' is archived and read-only. No new choice writes allowed`,
      );
    }

    // 2. Choice & Node Lookup
    const choice = await this.choicesRepository.findById(dto.choiceId);
    if (!choice) {
      throw new NotFoundException(`CHOICE_NOT_FOUND: Choice '${dto.choiceId}' not found`);
    }

    const node = await this.storyNodesRepository.findById(choice.storyNodeId);
    if (!node || node.storyVersionId !== version.id) {
      throw new NotFoundException(
        `Choice '${dto.choiceId}' does not belong to story version '${dto.storyVersionId}'`,
      );
    }

    // 3. Option Lookup (Invariant ENG-004)
    const option = await this.choiceOptionsRepository.findById(dto.choiceOptionId);
    if (!option || option.choiceId !== choice.id) {
      throw new NotFoundException(
        `CHOICE_OPTION_NOT_FOUND: Choice option '${dto.choiceOptionId}' does not belong to choice '${choice.id}'`,
      );
    }

    // 4. Voting Window Check (Invariant ENG-003)
    const now = new Date();
    const deadline = choice.votingEndsAt || node.votingEndsAt;
    if (deadline && deadline < now) {
      throw new ConflictException(
        `VOTING_WINDOW_CLOSED: Voting window for choice '${choice.id}' closed at ${deadline.toISOString()}`,
      );
    }

    // 5. Idempotency Check (Invariant ENG-002)
    const existingChoice = await this.userChoicesRepository.findByUserAndChoice(
      user.id,
      choice.id,
    );
    if (existingChoice) {
      this.logger.log(`Idempotent choice return for user '${user.id}', choice '${choice.id}'`);
      const destinationNodeDto = await this.buildDestinationNode(
        user,
        existingChoice.choiceOptionId,
      );
      return {
        userChoice: {
          id: existingChoice.id,
          userId: existingChoice.userId,
          choiceId: existingChoice.choiceId,
          choiceOptionId: existingChoice.choiceOptionId,
          storyVersionId: existingChoice.storyVersionId,
          isFallback: existingChoice.isFallback,
          createdAt: existingChoice.createdAt,
        },
        destinationNode: destinationNodeDto,
        xpAwarded: 0,
      };
    }

    // 6. Verify Destination Node
    const destinationNode = await this.storyNodesRepository.findById(option.destinationNodeId);
    if (!destinationNode || destinationNode.storyVersionId !== version.id) {
      throw new BadRequestException(
        `DESTINATION_NODE_INVALID: Destination node '${option.destinationNodeId}' not found in story version`,
      );
    }

    // 7. ACID Transaction Execution (Invariant ENG-001, ENG-010)
    const userChoiceId = generateUlid();
    const xpLedgerId = generateUlid();
    const xpPoints = 50;

    let createdUserChoice: UserChoice | null = null;

    try {
      const db = this.dbService.getDb();
      await db.transaction(async (tx) => {
        createdUserChoice = await this.userChoicesRepository.create(
          {
            id: userChoiceId,
            userId: user.id,
            choiceId: choice.id,
            choiceOptionId: option.id,
            storyVersionId: version.id,
            isFallback: false,
          },
          tx,
        );

        await this.choiceOptionsRepository.incrementVoteCount(option.id, tx);

        await this.xpLedgerRepository.create(
          {
            id: xpLedgerId,
            userId: user.id,
            action: 'CHOICE_MADE',
            points: xpPoints,
            referenceId: userChoiceId,
          },
          tx,
        );
      });
    } catch (err: any) {
      // Invariant ENG-010: Catch concurrent duplicate submission race
      if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
        this.logger.warn(
          `Concurrent race condition duplicate caught for user '${user.id}', choice '${choice.id}'`,
        );
        const duplicateChoice = await this.userChoicesRepository.findByUserAndChoice(
          user.id,
          choice.id,
        );
        if (duplicateChoice) {
          const destinationNodeDto = await this.buildDestinationNode(
            user,
            duplicateChoice.choiceOptionId,
          );
          return {
            userChoice: {
              id: duplicateChoice.id,
              userId: duplicateChoice.userId,
              choiceId: duplicateChoice.choiceId,
              choiceOptionId: duplicateChoice.choiceOptionId,
              storyVersionId: duplicateChoice.storyVersionId,
              isFallback: duplicateChoice.isFallback,
              createdAt: duplicateChoice.createdAt,
            },
            destinationNode: destinationNodeDto,
            xpAwarded: 0,
          };
        }
      }
      throw err;
    }

    // 8. Build Destination Node DTO & Playback URL
    const destinationNodeDto = await this.buildDestinationNode(user, option.id);

    return {
      userChoice: {
        id: createdUserChoice!.id,
        userId: createdUserChoice!.userId,
        choiceId: createdUserChoice!.choiceId,
        choiceOptionId: createdUserChoice!.choiceOptionId,
        storyVersionId: createdUserChoice!.storyVersionId,
        isFallback: createdUserChoice!.isFallback,
        createdAt: createdUserChoice!.createdAt,
      },
      destinationNode: destinationNodeDto,
      xpAwarded: xpPoints,
    };
  }

  /**
   * Fallback auto-resolution when voting window closes without user choice
   */
  async resolveFallback(
    user: AuthenticatedUser,
    choiceId: string,
    storyVersionId: string,
  ): Promise<ChoiceResolutionResponseDto> {
    const version = await this.storyVersionsRepository.findById(storyVersionId);
    if (!version) {
      throw new NotFoundException(`Story version '${storyVersionId}' not found`);
    }

    const choice = await this.choicesRepository.findById(choiceId);
    if (!choice) {
      throw new NotFoundException(`CHOICE_NOT_FOUND: Choice '${choiceId}' not found`);
    }

    const node = await this.storyNodesRepository.findById(choice.storyNodeId);
    if (!node) {
      throw new NotFoundException(`Story node for choice '${choiceId}' not found`);
    }

    // Check existing
    const existing = await this.userChoicesRepository.findByUserAndChoice(user.id, choiceId);
    if (existing) {
      const destinationNodeDto = await this.buildDestinationNode(user, existing.choiceOptionId);
      return {
        userChoice: {
          id: existing.id,
          userId: existing.userId,
          choiceId: existing.choiceId,
          choiceOptionId: existing.choiceOptionId,
          storyVersionId: existing.storyVersionId,
          isFallback: existing.isFallback,
          createdAt: existing.createdAt,
        },
        destinationNode: destinationNodeDto,
        xpAwarded: 0,
      };
    }

    // Determine fallback option: explicit node.fallbackOptionId or first option
    let fallbackOptionId = node.fallbackOptionId;
    if (!fallbackOptionId) {
      const options = await this.choiceOptionsRepository.findByChoiceId(choiceId);
      if (options.length === 0) {
        throw new BadRequestException('No options available for fallback');
      }
      fallbackOptionId = options[0].id;
    }

    const userChoiceId = generateUlid();
    const createdUserChoice = await this.userChoicesRepository.create({
      id: userChoiceId,
      userId: user.id,
      choiceId,
      choiceOptionId: fallbackOptionId,
      storyVersionId,
      isFallback: true,
    });

    const destinationNodeDto = await this.buildDestinationNode(user, fallbackOptionId);

    return {
      userChoice: {
        id: createdUserChoice.id,
        userId: createdUserChoice.userId,
        choiceId: createdUserChoice.choiceId,
        choiceOptionId: createdUserChoice.choiceOptionId,
        storyVersionId: createdUserChoice.storyVersionId,
        isFallback: createdUserChoice.isFallback,
        createdAt: createdUserChoice.createdAt,
      },
      destinationNode: destinationNodeDto,
      xpAwarded: 0, // No XP for fallback auto-selections
    };
  }

  async getUserChoicesForVersion(userId: string, versionId: string): Promise<UserChoice[]> {
    return this.userChoicesRepository.findByUserAndVersion(userId, versionId);
  }

  private async buildDestinationNode(
    user: AuthenticatedUser,
    choiceOptionId: string,
  ): Promise<DestinationNodeDto> {
    const option = await this.choiceOptionsRepository.findById(choiceOptionId);
    if (!option) {
      throw new BadRequestException('Destination option not found');
    }

    const node = await this.storyNodesRepository.findById(option.destinationNodeId);
    if (!node) {
      throw new BadRequestException(
        `DESTINATION_NODE_INVALID: Node '${option.destinationNodeId}' not found`,
      );
    }

    const episode = await this.episodesRepository.findById(node.episodeId);
    const nextChoice = await this.choicesRepository.findByNodeId(node.id);

    let playbackUrl: string | null = null;
    try {
      const stream = await this.videosService.getPlaybackStream(user, node.episodeId);
      playbackUrl = stream.playbackUrl;
    } catch {
      playbackUrl = null;
    }

    return {
      id: node.id,
      episodeId: node.episodeId,
      episodeTitle: episode?.title,
      episodeNumber: episode?.episodeNumber,
      nodeType: node.nodeType,
      playbackUrl,
      hasChoice: !!nextChoice,
    };
  }
}
