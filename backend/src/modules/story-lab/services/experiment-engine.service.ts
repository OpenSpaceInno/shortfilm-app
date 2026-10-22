import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { CreateExperimentDto } from '../dto/create-experiment.dto';
import { UpdateExperimentStatusDto, UpdateExperimentDto } from '../dto/update-experiment.dto';
import { VariantAllocationResultDto } from '../dto/variant-allocation.dto';
import { STORY_LAB_THRESHOLDS } from '../constants/story-lab.constants';
import { type ExperimentStatus } from '../../../database/schema/story-lab.schema';

/**
 * 32-bit MurmurHash3 implementation for deterministic cohort allocation
 * Matches SR-ARCH-18 §5.2 deterministic audience allocation
 */
export function murmurHash3(key: string, seed: number = 0): number {
  let h = seed >>> 0;
  for (let i = 0; i < key.length; i++) {
    let k = key.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
  }
  h ^= key.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

@Injectable()
export class ExperimentEngineService {
  private readonly logger = new Logger(ExperimentEngineService.name);

  constructor(private readonly repository: StoryLabRepository) {}

  /**
   * Deterministically allocate a user into Variant A or Variant B
   */
  async allocateVariant(experimentId: string, userId: string): Promise<VariantAllocationResultDto> {
    const experiment = await this.repository.findExperimentById(experimentId);
    if (!experiment) {
      throw new NotFoundException(`Experiment with ID '${experimentId}' not found`);
    }

    const variantA = experiment.variants.find((v) => v.variantKey === 'A');
    const variantB = experiment.variants.find((v) => v.variantKey === 'B');

    if (!variantA || !variantB) {
      throw new BadRequestException(`Experiment '${experimentId}' is missing Variant A or Variant B definition`);
    }

    // If experiment is not RUNNING, consistently return Control (Variant A)
    if (experiment.status !== 'RUNNING') {
      return {
        experimentId: experiment.id,
        userId,
        bucket: 0,
        allocatedVariant: 'A',
        variantId: variantA.id,
        variantKey: 'A',
        variantName: variantA.name,
        configJson: (variantA.configJson as Record<string, any>) || null,
        status: experiment.status,
      };
    }

    // Deterministic hash bucket 0..99
    const hashVal = murmurHash3(`${experiment.id}:${userId}`);
    const bucket = hashVal % 100;
    const split = experiment.splitPercentage ?? 50;

    const isVariantB = bucket < split;
    const selected = isVariantB ? variantB : variantA;
    const selectedKey = isVariantB ? 'B' : 'A';

    return {
      experimentId: experiment.id,
      userId,
      bucket,
      allocatedVariant: selectedKey,
      variantId: selected.id,
      variantKey: selectedKey,
      variantName: selected.name,
      configJson: (selected.configJson as Record<string, any>) || null,
      status: experiment.status,
    };
  }

  /**
   * Create experiment with Control (A) and Candidate (B) variants
   */
  async createExperiment(dto: CreateExperimentDto, creatorUserId?: string) {
    const created = await this.repository.createExperimentWithVariants(
      {
        storyId: dto.storyId,
        name: dto.name,
        hypothesis: dto.hypothesis,
        targetMetric: dto.targetMetric || 'completion_rate',
        status: 'DRAFT',
        splitPercentage: dto.splitPercentage ?? 50,
        createdBy: creatorUserId,
      },
      {
        name: dto.variantA.name,
        description: dto.variantA.description,
        versionId: dto.variantA.versionId,
        nodeId: dto.variantA.nodeId,
        configJson: dto.variantA.configJson,
      },
      {
        name: dto.variantB.name,
        description: dto.variantB.description,
        versionId: dto.variantB.versionId,
        nodeId: dto.variantB.nodeId,
        configJson: dto.variantB.configJson,
      },
    );

    this.logger.log(`Created experiment '${created.id}' (${created.name}) with split ${created.splitPercentage}%`);
    return created;
  }

  /**
   * Transition experiment status with lifecycle checks
   */
  async updateExperimentStatus(experimentId: string, statusDto: UpdateExperimentStatusDto) {
    const experiment = await this.repository.findExperimentById(experimentId);
    if (!experiment) {
      throw new NotFoundException(`Experiment with ID '${experimentId}' not found`);
    }

    const updates: Partial<{ status: ExperimentStatus; startedAt: Date; concludedAt: Date }> = {
      status: statusDto.status,
    };

    if (statusDto.status === 'RUNNING' && !experiment.startedAt) {
      updates.startedAt = new Date();
    } else if (['CONCLUDED', 'APPLIED', 'DISCARDED'].includes(statusDto.status) && !experiment.concludedAt) {
      updates.concludedAt = new Date();
    }

    const updated = await this.repository.updateExperiment(experimentId, updates);
    this.logger.log(`Transitioned experiment '${experimentId}' to status '${statusDto.status}'`);
    return updated;
  }

  /**
   * Update experiment attributes
   */
  async updateExperiment(experimentId: string, dto: UpdateExperimentDto) {
    const experiment = await this.repository.findExperimentById(experimentId);
    if (!experiment) {
      throw new NotFoundException(`Experiment with ID '${experimentId}' not found`);
    }

    return await this.repository.updateExperiment(experimentId, dto);
  }

  /**
   * Record variant impression
   */
  async recordImpression(variantId: string): Promise<void> {
    await this.repository.recordVariantImpression(variantId);
  }

  /**
   * Record variant conversion/completion and verify failsafe
   */
  async recordCompletion(variantId: string, experimentId?: string): Promise<void> {
    await this.repository.recordVariantCompletion(variantId);

    if (experimentId) {
      await this.checkFailsafe(experimentId);
    }
  }

  /**
   * Automatic Failsafe: If Candidate (Variant B) drops > 15% vs Control (Variant A)
   * with adequate sample size, automatically PAUSE experiment and log alert
   */
  async checkFailsafe(experimentId: string): Promise<boolean> {
    const experiment = await this.repository.findExperimentById(experimentId);
    if (!experiment || experiment.status !== 'RUNNING') return false;

    const variantA = experiment.variants.find((v) => v.variantKey === 'A');
    const variantB = experiment.variants.find((v) => v.variantKey === 'B');

    if (!variantA || !variantB) return false;

    const impA = variantA.impressionsCount ?? 0;
    const impB = variantB.impressionsCount ?? 0;

    // Minimum sample size required before evaluating failsafe drop
    if (impA < 20 || impB < 20) return false;

    const rateA = Number(variantA.conversionRate ?? 0);
    const rateB = Number(variantB.conversionRate ?? 0);

    const relativeDrop = rateA - rateB;

    if (relativeDrop >= STORY_LAB_THRESHOLDS.FAILSAFE_DROP_PCT) {
      this.logger.warn(
        `FAILSAFE TRIGGERED on experiment '${experimentId}': Variant B conversion (${rateB.toFixed(
          2,
        )}) dropped ${relativeDrop.toFixed(2)} below Variant A (${rateA.toFixed(
          2,
        )}). Automatically PAUSING experiment.`,
      );

      await this.repository.updateExperiment(experimentId, {
        status: 'PAUSED',
      });
      return true;
    }

    return false;
  }
}
