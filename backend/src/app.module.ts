import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { VideosModule } from './modules/videos/videos.module';
import { SearchModule } from './modules/search/search.module';
import { InteractiveModule } from './modules/interactive/interactive.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { SocialModule } from './modules/social/social.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { AiModule } from './modules/ai/ai.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BusinessModule } from './modules/business/business.module';
import { StoryLabModule } from './modules/story-lab/story-lab.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { ObservabilityModule } from './modules/observability';
import { PerformanceModule } from './modules/performance';
import { SecurityModule } from './modules/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL', 'info'),
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                },
            genReqId: (req: any) =>
              req.headers['x-correlation-id'] ||
              req.headers['cf-ray'] ||
              req.headers['x-request-id'] ||
              req.id,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["set-cookie"]',
                'req.body.password',
                'req.body.refreshToken',
                'req.body.token',
                'req.body.payoutAccountDetails',
                'req.body.taxNumber',
                'req.body.cardNumber',
                'req.body.cvv',
                'req.body.creditCard',
              ],
              censor: '[REDACTED]',
            },
          },
        };
      },
    }),
    ObservabilityModule,
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ContentModule,
    VideosModule,
    SearchModule,
    InteractiveModule,
    EngagementModule,
    GamificationModule,
    SocialModule,
    NotificationsModule,
    CreatorsModule,
    AiModule,
    SubscriptionsModule,
    AnalyticsModule,
    BusinessModule,
    StoryLabModule,
    AuditModule,
    AdminModule,
    PerformanceModule,
    SecurityModule,
  ],
})
export class AppModule {}



