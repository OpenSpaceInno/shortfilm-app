import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { badges, Badge, NewBadge } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

export const CANONICAL_BADGES: Array<Omit<NewBadge, 'id' | 'createdAt'>> = [
  {
    slug: 'FIRST_STEP',
    name: 'First Step',
    description: 'Complete your first interactive short episode',
    category: 'WATCH',
    criteriaType: 'EPISODES_WATCHED',
    criteriaValue: 1,
    xpReward: 50,
  },
  {
    slug: 'BINGE_RUNNER',
    name: 'Binge Runner',
    description: 'Complete 5 interactive episodes across any series',
    category: 'WATCH',
    criteriaType: 'EPISODES_WATCHED',
    criteriaValue: 5,
    xpReward: 100,
  },
  {
    slug: 'PATHFINDER',
    name: 'Pathfinder',
    description: 'Make your first branching dilemma choice in an interactive story',
    category: 'CHOICE',
    criteriaType: 'CHOICES_MADE',
    criteriaValue: 1,
    xpReward: 50,
  },
  {
    slug: 'DECISION_MAKER',
    name: 'Decision Maker',
    description: 'Make 10 narrative choices shaping story destinies',
    category: 'CHOICE',
    criteriaType: 'CHOICES_MADE',
    criteriaValue: 10,
    xpReward: 150,
  },
  {
    slug: 'DAILY_DEVOTION',
    name: 'Daily Devotion',
    description: 'Maintain an active daily viewing streak of 3 consecutive days',
    category: 'STREAK',
    criteriaType: 'STREAK_DAYS',
    criteriaValue: 3,
    xpReward: 75,
  },
  {
    slug: 'WEEK_WARRIOR',
    name: 'Week Warrior',
    description: 'Maintain an unbroken active streak of 7 consecutive days',
    category: 'STREAK',
    criteriaType: 'STREAK_DAYS',
    criteriaValue: 7,
    xpReward: 200,
  },
  {
    slug: 'CENTURION',
    name: 'Centurion',
    description: 'Accumulate 500 lifetime XP points',
    category: 'XP',
    criteriaType: 'XP_THRESHOLD',
    criteriaValue: 500,
    xpReward: 100,
  },
  {
    slug: 'STORY_LEGEND',
    name: 'Story Legend',
    description: 'Ascend to platform mastery with 2000 lifetime XP points',
    category: 'XP',
    criteriaType: 'XP_THRESHOLD',
    criteriaValue: 2000,
    xpReward: 500,
  },
];

@Injectable()
export class BadgesRepository implements OnModuleInit {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async onModuleInit() {
    await this.ensureDefaultBadges();
  }

  async ensureDefaultBadges(): Promise<void> {
    try {
      for (const badgeDef of CANONICAL_BADGES) {
        const existing = await this.findBySlug(badgeDef.slug);
        if (!existing) {
          await this.create({
            id: generateUlid(),
            ...badgeDef,
          });
        }
      }
    } catch {
      // Ignore database connection errors during isolated unit tests
    }
  }

  async findAll(): Promise<Badge[]> {
    return this.db.select().from(badges);
  }

  async findById(id: string): Promise<Badge | null> {
    const results = await this.db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return results[0] || null;
  }

  async findBySlug(slug: string): Promise<Badge | null> {
    const results = await this.db.select().from(badges).where(eq(badges.slug, slug)).limit(1);
    return results[0] || null;
  }

  async findByCategory(category: string): Promise<Badge[]> {
    return this.db.select().from(badges).where(eq(badges.category, category));
  }

  async create(data: NewBadge): Promise<Badge> {
    await this.db.insert(badges).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }
}
