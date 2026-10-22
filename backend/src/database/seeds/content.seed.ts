import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { generateUlid, ulidToBinary } from '../utils/ulid.util';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const GENRES = [
  { name: 'Sci-Fi', slug: 'sci-fi', icon: 'zap' },
  { name: 'Thriller', slug: 'thriller', icon: 'alert-triangle' },
  { name: 'Romance', slug: 'romance', icon: 'heart' },
  { name: 'Fantasy', slug: 'fantasy', icon: 'sparkles' },
  { name: 'Horror', slug: 'horror', icon: 'skull' },
  { name: 'Mystery', slug: 'mystery', icon: 'search' },
  { name: 'Drama', slug: 'drama', icon: 'film' },
  { name: 'Comedy', slug: 'comedy', icon: 'smile' },
  { name: 'Cyberpunk', slug: 'cyberpunk', icon: 'cpu' },
  { name: 'Action', slug: 'action', icon: 'flame' },
];

const TAGS = [
  { name: 'Interactive', slug: 'interactive' },
  { name: 'Cliffhanger', slug: 'cliffhanger' },
  { name: 'Time Loop', slug: 'time-loop' },
  { name: 'AI Mystery', slug: 'ai-mystery' },
  { name: 'Multiple Endings', slug: 'multiple-endings' },
];

export async function seedContent() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'shortreel_user';
  const password = process.env.DATABASE_PASSWORD || 'shortreel_password';
  const database = process.env.DATABASE_NAME || 'shortreel_dev';

  console.log(`[Seed Content] Connecting to MySQL at ${host}:${port}/${database}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    console.log('[Seed Content] Seeding canonical genres...');
    for (const genre of GENRES) {
      const id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO genres (id, name, slug, icon)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon)`,
        [id, genre.name, genre.slug, genre.icon],
      );
    }

    console.log('[Seed Content] Seeding canonical tags...');
    for (const tag of TAGS) {
      const id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO tags (id, name, slug)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [id, tag.name, tag.slug],
      );
    }

    // Ensure a seed creator user exists
    const [existingUsers] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      ['creator@shortreel.com'],
    );

    let creatorUserId: Buffer;
    if (existingUsers.length > 0) {
      creatorUserId = existingUsers[0].id;
    } else {
      creatorUserId = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO users (id, external_auth_provider, external_subject_id, email, display_name, status)
         VALUES (?, 'AUTH0', 'auth0|seed_creator_123', 'creator@shortreel.com', 'Elena Vance', 'ACTIVE')`,
        [creatorUserId],
      );

      // Assign CREATOR role to this seed user
      const [roleRows] = await connection.query<mysql.RowDataPacket[]>(
        "SELECT id FROM roles WHERE name = 'CREATOR'",
      );
      if (roleRows.length > 0) {
        await connection.query(
          `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [creatorUserId, roleRows[0].id],
        );
      }
    }

    // Ensure creator profile exists
    const [existingCreators] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id FROM creators WHERE user_id = ?',
      [creatorUserId],
    );

    let creatorId: Buffer;
    if (existingCreators.length > 0) {
      creatorId = existingCreators[0].id;
    } else {
      creatorId = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO creators (id, user_id, display_name, bio, tier, status, verified_at)
         VALUES (?, ?, 'Elena Vance', 'Sci-fi filmmaker and narrative puzzle architect.', 'VERIFIED', 'ACTIVE', NOW(3))`,
        [creatorId, creatorUserId],
      );
    }

    // Seed sample featured story: The Quantum Divergence
    const [existingStories] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id FROM stories WHERE title = ?',
      ['The Quantum Divergence'],
    );

    let storyId: Buffer;
    if (existingStories.length > 0) {
      storyId = existingStories[0].id;
    } else {
      storyId = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO stories (
          id, creator_id, title, synopsis, premise, status, language,
          thumbnail_url, poster_url, content_rating, target_audience, view_count, published_at
         ) VALUES (?, ?, 'The Quantum Divergence',
          'When Dr. Clara Croft discovers an anomaly in the quantum field, each choice fragments her timeline into unpredictable realities.',
          'Choose the timeline. Survive the paradox.',
          'PUBLISHED', 'en',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
          '16+', 'Young Adults & Sci-Fi Enthusiasts', 14200, NOW(3))`,
        [storyId, creatorId],
      );

      // Link Sci-Fi and Thriller genres
      const [genreRows] = await connection.query<mysql.RowDataPacket[]>(
        "SELECT id FROM genres WHERE slug IN ('sci-fi', 'thriller')",
      );
      for (const g of genreRows) {
        await connection.query(
          `INSERT IGNORE INTO story_genres (story_id, genre_id) VALUES (?, ?)`,
          [storyId, g.id],
        );
      }

      // Create Season 1
      const seasonId = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO seasons (id, story_id, title, season_number, synopsis)
         VALUES (?, ?, 'Season 1: Quantum Collapse', 1, 'The original fracture that started the split universe.')`,
        [seasonId, storyId],
      );

      // Create Episode 1 (Free)
      const ep1Id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO episodes (id, season_id, title, episode_number, synopsis, thumbnail_url, is_free, published_at)
         VALUES (?, ?, 'The Midnight Paradox', 1, 'Clara observes the impossible signal inside the CERN replica lab.',
         'https://images.unsplash.com/photo-1518709268805-4e9042af9f23', TRUE, NOW(3))`,
        [ep1Id, seasonId],
      );

      // Create Episode 2 (Premium)
      const ep2Id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO episodes (id, season_id, title, episode_number, synopsis, thumbnail_url, is_free, published_at)
         VALUES (?, ?, 'Fractured Reflections', 2, 'Two versions of Clara awaken in parallel realities.',
         'https://images.unsplash.com/photo-1451187580459-43490279c0fa', FALSE, NOW(3))`,
        [ep2Id, seasonId],
      );
    }

    console.log('[Seed Content] Content seeded successfully.');
  } catch (error) {
    console.error('[Seed Content] Seeding failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedContent();
}
