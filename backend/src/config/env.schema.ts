import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('api'),
  API_VERSION: z.string().default('v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_USER: z.string().default('shortreel_user'),
  DATABASE_PASSWORD: z.string().default('shortreel_password'),
  DATABASE_NAME: z.string().default('shortreel_dev'),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // Auth0
  AUTH0_DOMAIN: z.string().default('shortreel-dev.auth0.com'),
  AUTH0_AUDIENCE: z.string().default('https://api.shortreel.io'),
  AUTH0_ISSUER: z.string().default('https://shortreel-dev.auth0.com/'),
  AUTH0_WEBHOOK_SECRET: z.string().default('dev_auth0_webhook_secret_key_32chars_min'),

  // Video & Payments (Optional for bootstrap, required for M07/M21)
  CLOUDFLARE_STREAM_ACCOUNT_ID: z.string().optional().default(''),
  CLOUDFLARE_STREAM_API_TOKEN: z.string().optional().default(''),
  CLOUDFLARE_STREAM_WEBHOOK_SECRET: z.string().optional().default(''),
  CLOUDFLARE_STREAM_KEY_ID: z.string().optional().default(''),
  CLOUDFLARE_STREAM_JWK_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Environment configuration validation error:\n${errorDetails}`);
  }
  return parsed.data;
}
