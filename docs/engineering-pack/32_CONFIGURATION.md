# 32. SHORTREEL — APPLICATION CONFIGURATION

## NestJS Config Structure

`	ypescript
// Using @nestjs/config + Joi validation
export const configSchema = Joi.object({
  NODE_ENV:                Joi.string().valid('development','staging','production').required(),
  PORT:                    Joi.number().default(3000),
  DB_HOST:                 Joi.string().required(),
  DB_PORT:                 Joi.number().default(3306),
  DB_NAME:                 Joi.string().required(),
  DB_USER:                 Joi.string().required(),
  DB_PASSWORD:             Joi.string().required(),
  DB_POOL_SIZE:            Joi.number().default(20),
  REDIS_URL:               Joi.string().required(),
  JWT_PRIVATE_KEY:         Joi.string().required(),
  JWT_PUBLIC_KEY:          Joi.string().required(),
  JWT_EXPIRES_IN:          Joi.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS:  Joi.number().default(30),
  CLOUDFLARE_ACCOUNT_ID:   Joi.string().required(),
  CLOUDFLARE_STREAM_KEY:   Joi.string().required(),
  CLOUDFLARE_R2_BUCKET:    Joi.string().required(),
  CLOUDFLARE_R2_ENDPOINT:  Joi.string().required(),
  RAZORPAY_KEY_ID:         Joi.string().required(),
  RAZORPAY_KEY_SECRET:     Joi.string().required(),
  STRIPE_SECRET_KEY:       Joi.string().when('NODE_ENV',{is:'production',then:Joi.required()}),
  ANTHROPIC_API_KEY:       Joi.string().required(),
  OPENAI_API_KEY:          Joi.string().optional(),
  SENDGRID_API_KEY:        Joi.string().required(),
  FCM_SERVICE_ACCOUNT:     Joi.string().required(),
  FRONTEND_URL:            Joi.string().required(),
  ENCRYPTION_KEY:          Joi.string().length(64).required(),
});
`

All config accessed via typed ConfigService — never via process.env directly in business code.
