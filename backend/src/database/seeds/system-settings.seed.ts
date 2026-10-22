import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { generateUlid, ulidToBinary } from '../utils/ulid.util';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export const DEFAULT_SYSTEM_SETTINGS = [
  {
    category: 'GENERAL',
    key: 'platform_name',
    value: 'ShortReel',
    valueType: 'STRING',
    description: 'Name of the interactive short-series platform',
    isPublic: true,
  },
  {
    category: 'GENERAL',
    key: 'tagline',
    value: "India's First Interactive Short-Form OTT",
    valueType: 'STRING',
    description: 'Platform branding tagline',
    isPublic: true,
  },
  {
    category: 'GENERAL',
    key: 'support_email',
    value: 'support@shortreel.in',
    valueType: 'STRING',
    description: 'Customer and creator support contact address',
    isPublic: true,
  },
  {
    category: 'GENERAL',
    key: 'maintenance_mode',
    value: false,
    valueType: 'BOOLEAN',
    description: 'When true, client apps display a maintenance message for non-admin requests',
    isPublic: true,
  },
  {
    category: 'CONTENT_DEFAULTS',
    key: 'default_language',
    value: 'Hindi',
    valueType: 'STRING',
    description: 'Default language applied to new series',
    isPublic: true,
  },
  {
    category: 'CONTENT_DEFAULTS',
    key: 'default_age_rating',
    value: '13+',
    valueType: 'STRING',
    description: 'Default age rating compliance tier',
    isPublic: true,
  },
  {
    category: 'CONTENT_DEFAULTS',
    key: 'video_format',
    value: '9:16',
    valueType: 'STRING',
    description: 'Platform native vertical video aspect ratio',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_interactive_stories',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable interactive decision points and branching playback',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_story_predictions',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable XP gamified storyline outcome predictions',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_character_following',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable following characters for story arc updates',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_creator_studio',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable creator publishing studio & node graph tools',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_ai_studio',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable AI Story Studio generative tools for approved creators',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_push_notifications',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable push notification dispatching via FCM/APNs',
    isPublic: true,
  },
  {
    category: 'FEATURE_FLAGS',
    key: 'feature_social_sharing',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Enable story branch sharing cards and deep links',
    isPublic: true,
  },
  {
    category: 'MODERATION',
    key: 'auto_toxicity_filter',
    value: true,
    valueType: 'BOOLEAN',
    description: 'Automatically flag high-toxicity content in review queues',
    isPublic: false,
  },
  {
    category: 'MODERATION',
    key: 'max_reports_before_auto_hold',
    value: 5,
    valueType: 'NUMBER',
    description: 'Number of unique user reports before auto-quarantine pending review',
    isPublic: false,
  },
];

export async function seedSystemSettings() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'shortreel_user';
  const password = process.env.DATABASE_PASSWORD || 'shortreel_password';
  const database = process.env.DATABASE_NAME || 'shortreel_dev';

  console.log(`[Seed:SystemSettings] Connecting to MySQL at ${host}:${port}/${database}...`);
  const connection = await mysql.createConnection({ host, port, user, password, database });

  try {
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      const [existing] = await connection.query<mysql.RowDataPacket[]>(
        'SELECT id FROM system_settings WHERE `key` = ?',
        [setting.key],
      );

      if (!existing || existing.length === 0) {
        const id = ulidToBinary(generateUlid());
        await connection.query(
          `INSERT INTO system_settings (id, category, \`key\`, value, value_type, description, is_public, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            id,
            setting.category,
            setting.key,
            JSON.stringify(setting.value),
            setting.valueType,
            setting.description,
            setting.isPublic ? 1 : 0,
          ],
        );
        console.log(`[Seed:SystemSettings] Inserted '${setting.key}'`);
      } else {
        console.log(`[Seed:SystemSettings] Setting '${setting.key}' already exists, skipping.`);
      }
    }
    console.log('[Seed:SystemSettings] System settings seed complete.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedSystemSettings()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
