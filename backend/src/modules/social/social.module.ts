import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { InteractiveModule } from '../interactive/interactive.module';
import { ContentModule } from '../content/content.module';
import { GamificationModule } from '../gamification/gamification.module';
import { SocialController } from './controllers/social.controller';
import { SocialService } from './services/social.service';
import { VotesRepository } from './repositories/votes.repository';
import { PredictionsRepository } from './repositories/predictions.repository';
import { FollowsRepository } from './repositories/follows.repository';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    InteractiveModule,
    ContentModule,
    GamificationModule,
  ],
  controllers: [SocialController],
  providers: [
    SocialService,
    VotesRepository,
    PredictionsRepository,
    FollowsRepository,
  ],
  exports: [
    SocialService,
    VotesRepository,
    PredictionsRepository,
    FollowsRepository,
  ],
})
export class SocialModule {}
