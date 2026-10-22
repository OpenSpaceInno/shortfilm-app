import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SubscriptionPlansRepository, PlanFilterOptions } from '../repositories/subscription-plans.repository';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanResponseDto,
  EntitlementMatrixResponseDto,
  EntitlementFeatureComparisonDto,
} from '../dto';
import { SubscriptionPlan, NewSubscriptionPlan } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    private readonly plansRepository: SubscriptionPlansRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Retrieves all active subscription plans matching optional filter criteria
   */
  async getActivePlans(options: PlanFilterOptions = {}): Promise<SubscriptionPlanResponseDto[]> {
    this.logger.log({ msg: 'Fetching active subscription plans catalog', options });
    const plans = await this.plansRepository.findAll(options);
    return plans.map((plan) => this.mapToResponseDto(plan));
  }

  /**
   * Retrieves a single subscription plan by its unique URL slug
   */
  async getPlanBySlug(slug: string): Promise<SubscriptionPlanResponseDto> {
    this.logger.log({ msg: 'Looking up subscription plan by slug', slug });
    const plan = await this.plansRepository.findBySlug(slug);
    if (!plan) {
      throw new NotFoundException(`Subscription plan with slug '${slug}' not found`);
    }
    return this.mapToResponseDto(plan);
  }

  /**
   * Retrieves a single subscription plan by its ULID identifier
   */
  async getPlanById(id: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID '${id}' not found`);
    }
    return this.mapToResponseDto(plan);
  }

  /**
   * Generates the platform feature entitlement comparison matrix across all tiers
   */
  getEntitlementMatrix(): EntitlementMatrixResponseDto {
    const features: EntitlementFeatureComparisonDto[] = [
      {
        featureKey: 'premium_episodes',
        featureName: 'Premium Episodes',
        category: 'Playback & Content',
        description: 'Access beyond the free teaser episodes of short-series',
        freeTier: 'First 2 episodes only',
        vipMonthlyTier: 'Unlimited all episodes',
        vipAnnualTier: 'Unlimited all episodes',
        studentTier: 'Unlimited all episodes',
        status: 'Active',
      },
      {
        featureKey: 'ad_free',
        featureName: 'Ad-Free Playback',
        category: 'Playback & Content',
        description: 'Uninterrupted vertical streaming without preroll or banner ads',
        freeTier: 'Standard ads between episodes',
        vipMonthlyTier: '100% Ad-Free',
        vipAnnualTier: '100% Ad-Free',
        studentTier: '100% Ad-Free',
        status: 'Active',
      },
      {
        featureKey: 'streaming_resolution',
        featureName: 'Streaming Resolution',
        category: 'Video Quality',
        description: 'Maximum resolution and bitrate profile delivered via CDN',
        freeTier: '720p HD Portrait',
        vipMonthlyTier: '1080p FHD Portrait',
        vipAnnualTier: '4K HDR Portrait Profile',
        studentTier: '1080p FHD Portrait',
        status: 'Active',
      },
      {
        featureKey: 'early_access',
        featureName: 'Early Episode Drops',
        category: 'Release Windows',
        description: 'Advance access window before scheduled public drop date',
        freeTier: 'Standard release schedule',
        vipMonthlyTier: '48-Hour Early Access',
        vipAnnualTier: '48-Hour Early Access',
        studentTier: '24-Hour Early Access',
        status: 'Active',
      },
      {
        featureKey: 'exclusive_choices',
        featureName: 'Exclusive Interactive Branches',
        category: 'Story Mechanics',
        description: 'Secret director endings, alternate POV choices, and VIP paths',
        freeTier: 'Standard branching tree',
        vipMonthlyTier: 'Secret branches & VIP choices',
        vipAnnualTier: 'Secret branches & VIP choices',
        studentTier: 'Secret branches & VIP choices',
        status: 'Active',
      },
      {
        featureKey: 'prediction_multiplier',
        featureName: 'Story Prediction Bonus XP',
        category: 'Gamification & Rewards',
        description: 'Multiplier applied to community story outcome predictions',
        freeTier: '1.0x Base XP',
        vipMonthlyTier: '2.0x Double XP',
        vipAnnualTier: '2.0x Double XP + Golden Badge',
        studentTier: '1.5x Bonus XP',
        status: 'Active',
      },
      {
        featureKey: 'concurrent_devices',
        featureName: 'Concurrent Streams',
        category: 'Account & Devices',
        description: 'Number of active simultaneous video stream sessions permitted',
        freeTier: '1 Device',
        vipMonthlyTier: '2 Devices',
        vipAnnualTier: '4 Devices',
        studentTier: '1 Device',
        status: 'Active',
      },
      {
        featureKey: 'offline_downloads',
        featureName: 'Offline Downloads',
        category: 'Mobile Features',
        description: 'Ability to save encrypted episodes locally for offline commute playback',
        freeTier: 'Disabled',
        vipMonthlyTier: 'Up to 20 Episodes',
        vipAnnualTier: 'Unlimited Downloads',
        studentTier: 'Up to 10 Episodes',
        status: 'Active',
      },
    ];

    return {
      features,
      totalFeatures: features.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Admin: Creates a new subscription plan with slug collision check
   */
  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    this.logger.log({ msg: 'Admin creating new subscription plan', slug: dto.slug });
    const existing = await this.plansRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Subscription plan with slug '${dto.slug}' already exists`);
    }

    const defaultMatrix = {
      unlimitedEpisodes: dto.tier !== 'FREE',
      adFree: dto.tier !== 'FREE',
      maxResolution: dto.tier === 'FREE' ? ('720p' as const) : ('1080p' as const),
      earlyAccessHours: dto.tier === 'VIP' ? 48 : 0,
      exclusiveChoices: dto.tier !== 'FREE',
      predictionXpMultiplier: dto.tier === 'FREE' ? 1.0 : 2.0,
      maxConcurrentDevices: dto.tier === 'FREE' ? 1 : 2,
      offlineDownloads: dto.tier !== 'FREE',
    };

    const newPlan: NewSubscriptionPlan = {
      id: generateUlid(),
      name: dto.name,
      slug: dto.slug,
      tier: dto.tier,
      description: dto.description || null,
      priceMonthly: dto.priceMonthly.toFixed(2),
      priceAnnually: dto.priceAnnually !== undefined ? dto.priceAnnually.toFixed(2) : null,
      currency: dto.currency || 'INR',
      billingInterval: dto.billingInterval,
      trialDays: dto.trialDays ?? 0,
      features: dto.features || [],
      entitlementMatrix: dto.entitlementMatrix || defaultMatrix,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isPopular: dto.isPopular !== undefined ? dto.isPopular : false,
      sortOrder: dto.sortOrder ?? 0,
    };

    const created = await this.plansRepository.create(newPlan);
    return this.mapToResponseDto(created);
  }

  /**
   * Admin: Updates an existing subscription plan
   */
  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    this.logger.log({ msg: 'Admin updating subscription plan', id });
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID '${id}' not found`);
    }

    if (dto.slug && dto.slug !== plan.slug) {
      const existing = await this.plansRepository.findBySlug(dto.slug);
      if (existing) {
        throw new ConflictException(`Subscription plan with slug '${dto.slug}' already exists`);
      }
    }

    const updateData: Partial<NewSubscriptionPlan> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.tier !== undefined) updateData.tier = dto.tier;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priceMonthly !== undefined) updateData.priceMonthly = dto.priceMonthly.toFixed(2);
    if (dto.priceAnnually !== undefined) updateData.priceAnnually = dto.priceAnnually ? dto.priceAnnually.toFixed(2) : null;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.billingInterval !== undefined) updateData.billingInterval = dto.billingInterval;
    if (dto.trialDays !== undefined) updateData.trialDays = dto.trialDays;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.entitlementMatrix !== undefined) updateData.entitlementMatrix = dto.entitlementMatrix;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isPopular !== undefined) updateData.isPopular = dto.isPopular;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const updated = await this.plansRepository.update(id, updateData);
    return this.mapToResponseDto(updated!);
  }

  /**
   * Admin: Toggles plan active status or soft deletes
   */
  async togglePlanStatus(id: string, isActive: boolean): Promise<SubscriptionPlanResponseDto> {
    const updated = await this.plansRepository.update(id, { isActive });
    if (!updated) {
      throw new NotFoundException(`Subscription plan with ID '${id}' not found`);
    }
    return this.mapToResponseDto(updated);
  }

  /**
   * Admin: Retrieves all plans including inactive, enriched with subscriber count
   */
  async getAdminPlans(): Promise<Array<SubscriptionPlanResponseDto & { subscriberCount: number }>> {
    const plans = await this.plansRepository.findAll({ includeInactive: true });
    return Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await this.subscriptionsRepository.countSubscribersByPlanId(plan.id);
        return {
          ...this.mapToResponseDto(plan),
          subscriberCount,
        };
      }),
    );
  }

  /**
   * Maps internal database SubscriptionPlan entity to clean response DTO
   */
  mapToResponseDto(plan: SubscriptionPlan): SubscriptionPlanResponseDto {
    const fallbackMatrix = {
      unlimitedEpisodes: plan.tier !== 'FREE',
      adFree: plan.tier !== 'FREE',
      maxResolution: (plan.tier === 'FREE' ? '720p' : '1080p') as '720p' | '1080p' | '4K',
      earlyAccessHours: plan.tier === 'VIP' ? 48 : 0,
      exclusiveChoices: plan.tier !== 'FREE',
      predictionXpMultiplier: plan.tier === 'FREE' ? 1.0 : 2.0,
      maxConcurrentDevices: plan.tier === 'FREE' ? 1 : 2,
      offlineDownloads: plan.tier !== 'FREE',
    };

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      tier: plan.tier,
      description: plan.description,
      priceMonthly: Number(plan.priceMonthly),
      priceAnnually: plan.priceAnnually ? Number(plan.priceAnnually) : null,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      trialDays: plan.trialDays,
      features: (plan.features as string[]) || [],
      entitlementMatrix: (plan.entitlementMatrix as any) || fallbackMatrix,
      isActive: Boolean(plan.isActive),
      isPopular: Boolean(plan.isPopular),
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
