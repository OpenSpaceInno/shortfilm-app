import { Module } from '@nestjs/common';
import { CreatorsController } from './controllers/creators.controller';
import { AdminCreatorsController } from './controllers/admin-creators.controller';
import { CreatorsService } from './services/creators.service';
import { CreatorsRepository } from './repositories/creators.repository';
import { CreatorApplicationsRepository } from './repositories/creator-applications.repository';
import { CreatorVerificationsRepository } from './repositories/creator-verifications.repository';
import { CreatorNotesRepository } from './repositories/creator-notes.repository';
import { CreatorSubmissionsRepository } from './repositories/creator-submissions.repository';
import { CreatorEarningsRepository } from './repositories/creator-earnings.repository';
import { CreatorEarningsService } from './services/creator-earnings.service';
import { CreatorAnalyticsRepository } from './repositories/creator-analytics.repository';
import { CreatorAnalyticsService } from './services/creator-analytics.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CreatorsController, AdminCreatorsController],
  providers: [
    CreatorsRepository,
    CreatorApplicationsRepository,
    CreatorVerificationsRepository,
    CreatorNotesRepository,
    CreatorSubmissionsRepository,
    CreatorEarningsRepository,
    CreatorAnalyticsRepository,
    CreatorsService,
    CreatorEarningsService,
    CreatorAnalyticsService,
  ],
  exports: [
    CreatorsService,
    CreatorEarningsService,
    CreatorAnalyticsService,
    CreatorsRepository,
    CreatorApplicationsRepository,
    CreatorVerificationsRepository,
    CreatorNotesRepository,
    CreatorSubmissionsRepository,
    CreatorEarningsRepository,
    CreatorAnalyticsRepository,
  ],
})
export class CreatorsModule {}
