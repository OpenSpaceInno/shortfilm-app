import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { generateUlid, ulidToBinary } from '../utils/ulid.util';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export const SEED_PLANS = [
  {
    name: 'Free Tier',
    slug: 'free',
    tier: 'FREE',
    description: 'Enjoy free teaser episodes with standard ad support',
    price_monthly: 0.0,
    price_annually: null,
    currency: 'INR',
    billing_interval: 'FREE',
    trial_days: 0,
    features: [
      'First 2 episodes free per season',
      'Standard ad-supported playback',
      '720p HD portrait streaming',
      'Community voting & standard choices',
      '1 concurrent device',
    ],
    entitlement_matrix: {
      unlimitedEpisodes: false,
      adFree: false,
      maxResolution: '720p',
      earlyAccessHours: 0,
      exclusiveChoices: false,
      predictionXpMultiplier: 1.0,
      maxConcurrentDevices: 1,
      offlineDownloads: false,
    },
    is_active: true,
    is_popular: false,
    sort_order: 1,
  },
  {
    name: 'VIP Monthly',
    slug: 'vip-monthly',
    tier: 'VIP',
    description: 'Unlimited all-access vertical short-series with 1080p and ad-free playback',
    price_monthly: 149.0,
    price_annually: null,
    currency: 'INR',
    billing_interval: 'MONTHLY',
    trial_days: 0,
    features: [
      'All premium series & episodes unlocked',
      '100% Ad-Free uninterrupted streaming',
      '1080p Full HD portrait streaming',
      'Exclusive interactive choice branches & director cuts',
      '48-Hour Early Access to new weekly drops',
      '2x Double XP on narrative predictions',
      '2 concurrent devices',
    ],
    entitlement_matrix: {
      unlimitedEpisodes: true,
      adFree: true,
      maxResolution: '1080p',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      predictionXpMultiplier: 2.0,
      maxConcurrentDevices: 2,
      offlineDownloads: true,
    },
    is_active: true,
    is_popular: false,
    sort_order: 2,
  },
  {
    name: 'VIP Annual',
    slug: 'vip-annual',
    tier: 'VIP',
    description: 'Best value VIP membership with 44% savings, 7-day free trial, and VIP creator access',
    price_monthly: 83.25,
    price_annually: 999.0,
    currency: 'INR',
    billing_interval: 'ANNUAL',
    trial_days: 7,
    features: [
      'All VIP Monthly benefits included',
      'Save 44% vs monthly billing (equivalent to ₹83/mo)',
      '7-day free trial included',
      '4K HDR portrait streaming profile',
      'VIP Gold Badge on user profile & live comments',
      'Exclusive creator live meets & AMA access',
      '4 concurrent devices',
    ],
    entitlement_matrix: {
      unlimitedEpisodes: true,
      adFree: true,
      maxResolution: '4K',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      predictionXpMultiplier: 2.0,
      maxConcurrentDevices: 4,
      offlineDownloads: true,
      bonusFeatures: ['VIP Gold Badge', 'Creator AMAs', 'Beta Feature Previews'],
    },
    is_active: true,
    is_popular: true,
    sort_order: 3,
  },
  {
    name: 'Student VIP',
    slug: 'student-vip',
    tier: 'STUDENT',
    description: 'Special 50% discount for students with accredited institution credentials',
    price_monthly: 49.0,
    price_annually: null,
    currency: 'INR',
    billing_interval: 'MONTHLY',
    trial_days: 0,
    features: [
      'All VIP benefits included',
      'Special student discount rate (₹49/mo)',
      'Ad-free & 1080p FHD streaming',
      'Exclusive interactive choice branches',
      'Requires verified student credentials',
    ],
    entitlement_matrix: {
      unlimitedEpisodes: true,
      adFree: true,
      maxResolution: '1080p',
      earlyAccessHours: 24,
      exclusiveChoices: true,
      predictionXpMultiplier: 1.5,
      maxConcurrentDevices: 1,
      offlineDownloads: true,
    },
    is_active: true,
    is_popular: false,
    sort_order: 4,
  },
];

export async function seedSubscriptionPlans() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'shortreel_user';
  const password = process.env.DATABASE_PASSWORD || 'shortreel_password';
  const database = process.env.DATABASE_NAME || 'shortreel_dev';

  console.log(`[Seed Plans] Connecting to MySQL at ${host}:${port}/${database}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    console.log('[Seed Plans] Seeding canonical subscription plans catalog...');
    for (const plan of SEED_PLANS) {
      const id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO subscription_plans (
          id, name, slug, tier, description, price_monthly, price_annually,
          currency, billing_interval, trial_days, features, entitlement_matrix,
          is_active, is_popular, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          tier = VALUES(tier),
          description = VALUES(description),
          price_monthly = VALUES(price_monthly),
          price_annually = VALUES(price_annually),
          currency = VALUES(currency),
          billing_interval = VALUES(billing_interval),
          trial_days = VALUES(trial_days),
          features = VALUES(features),
          entitlement_matrix = VALUES(entitlement_matrix),
          is_active = VALUES(is_active),
          is_popular = VALUES(is_popular),
          sort_order = VALUES(sort_order)`,
        [
          id,
          plan.name,
          plan.slug,
          plan.tier,
          plan.description,
          plan.price_monthly,
          plan.price_annually,
          plan.currency,
          plan.billing_interval,
          plan.trial_days,
          JSON.stringify(plan.features),
          JSON.stringify(plan.entitlement_matrix),
          plan.is_active,
          plan.is_popular,
          plan.sort_order,
        ],
      );
      console.log(`  ✓ Plan seeded: ${plan.name} (${plan.slug})`);
    }

    console.log('[Seed Plans] All subscription plans seeded successfully.');
  } catch (error) {
    console.error('[Seed Plans] Error seeding plans:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedSubscriptionPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
