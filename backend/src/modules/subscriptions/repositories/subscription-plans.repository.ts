import { Injectable, Inject } from '@nestjs/common';
import { eq, and, asc, desc, sql, SQL } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  subscriptionPlans,
  SubscriptionPlan,
  NewSubscriptionPlan,
  BillingInterval,
  PlanTier,
} from '../../../database/schema';

export interface PlanFilterOptions {
  interval?: BillingInterval;
  tier?: PlanTier;
  includeInactive?: boolean;
}

@Injectable()
export class SubscriptionPlansRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findAll(options: PlanFilterOptions = {}): Promise<SubscriptionPlan[]> {
    const conditions: SQL[] = [];

    if (!options.includeInactive) {
      conditions.push(eq(subscriptionPlans.isActive, true));
    }

    if (options.interval) {
      conditions.push(eq(subscriptionPlans.billingInterval, options.interval));
    }

    if (options.tier) {
      conditions.push(eq(subscriptionPlans.tier, options.tier));
    }

    const query = this.db
      .select()
      .from(subscriptionPlans)
      .orderBy(asc(subscriptionPlans.sortOrder), asc(subscriptionPlans.priceMonthly));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const results = await this.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findBySlug(slug: string): Promise<SubscriptionPlan | null> {
    const results = await this.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, slug))
      .limit(1);

    return results[0] || null;
  }

  async create(data: NewSubscriptionPlan): Promise<SubscriptionPlan> {
    await this.db.insert(subscriptionPlans).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async update(id: string, data: Partial<NewSubscriptionPlan>): Promise<SubscriptionPlan | null> {
    await this.db
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    // Soft deactivation to preserve subscription references
    const updated = await this.update(id, { isActive: false });
    return !!updated;
  }

  async countActive(): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));

    return Number(results[0]?.count || 0);
  }
}
