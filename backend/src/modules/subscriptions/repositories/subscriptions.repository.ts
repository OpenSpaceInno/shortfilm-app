import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  subscriptions,
  subscriptionPlans,
  Subscription,
  NewSubscription,
  SubscriptionPlan,
} from '../../../database/schema';

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

@Injectable()
export class SubscriptionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findActiveByUserId(userId: string): Promise<SubscriptionWithPlan | null> {
    const results = await this.db
      .select({
        sub: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED']),
        ),
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!results[0]) return null;

    return {
      ...results[0].sub,
      plan: results[0].plan,
    };
  }

  async findLatestByUserId(userId: string): Promise<SubscriptionWithPlan | null> {
    const results = await this.db
      .select({
        sub: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!results[0]) return null;

    return {
      ...results[0].sub,
      plan: results[0].plan,
    };
  }

  async findById(id: string): Promise<SubscriptionWithPlan | null> {
    const results = await this.db
      .select({
        sub: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!results[0]) return null;

    return {
      ...results[0].sub,
      plan: results[0].plan,
    };
  }

  async create(data: NewSubscription): Promise<Subscription> {
    await this.db.insert(subscriptions).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }

  async update(id: string, data: Partial<NewSubscription>): Promise<Subscription | null> {
    await this.db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));

    return this.findById(id);
  }

  async findByProviderSubId(providerSubId: string): Promise<SubscriptionWithPlan | null> {
    const results = await this.db
      .select({
        sub: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.providerSubId, providerSubId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!results[0]) return null;

    return {
      ...results[0].sub,
      plan: results[0].plan,
    };
  }

  async countSubscribersByPlanId(planId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.planId, planId),
          inArray(subscriptions.status, ['ACTIVE', 'TRIAL']),
        ),
      );

    return Number(results[0]?.count || 0);
  }
}
