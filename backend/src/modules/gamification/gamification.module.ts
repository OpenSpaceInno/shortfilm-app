import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { InteractiveModule } from '../interactive/interactive.module';
import { EngagementModule } from '../engagement/engagement.module';
import { GamificationController } from './controllers/gamification.controller';
import { GamificationService } from './services/gamification.service';
import { BadgesRepository } from './repositories/badges.repository';
import { UserBadgesRepository } from './repositories/user-badges.repository';
import { UserStreaksRepository } from './repositories/user-streaks.repository';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    InteractiveModule,
    forwardRef(() => EngagementModule),
  ],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    BadgesRepository,
    UserBadgesRepository,
    UserStreaksRepository,
  ],
  exports: [
    GamificationService,
    BadgesRepository,
    UserBadgesRepository,
    UserStreaksRepository,
  ],
})
export class GamificationModule {}
