import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CreatorsModule } from '../creators/creators.module';

// Repositories
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { SystemSettingsRepository } from './repositories/system-settings.repository';
import { ModerationReportsRepository } from './repositories/moderation-reports.repository';
import { FeaturedCurationsRepository } from './repositories/featured-curations.repository';
import { AdminUsersRepository } from './repositories/admin-users.repository';
import { AdminContentRepository } from './repositories/admin-content.repository';

// Services
import { AuditService } from './services/audit.service';
import { SystemSettingsService } from './services/system-settings.service';
import { ContentCurationService } from './services/content-curation.service';
import { UserModerationService } from './services/user-moderation.service';
import { AdminSubmissionsService } from './services/admin-submissions.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

// Controllers
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminCurationController } from './controllers/admin-curation.controller';
import { AdminModerationController } from './controllers/admin-moderation.controller';
import { AdminSubmissionsController } from './controllers/admin-submissions.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';

@Module({
  imports: [DatabaseModule, CreatorsModule],
  controllers: [
    AdminDashboardController,
    AdminSettingsController,
    AdminCurationController,
    AdminModerationController,
    AdminSubmissionsController,
  ],
  providers: [
    AuditLogsRepository,
    SystemSettingsRepository,
    ModerationReportsRepository,
    FeaturedCurationsRepository,
    AdminUsersRepository,
    AdminContentRepository,
    AuditService,
    SystemSettingsService,
    ContentCurationService,
    UserModerationService,
    AdminSubmissionsService,
    AdminDashboardService,
  ],
  exports: [
    AuditService,
    SystemSettingsService,
    ContentCurationService,
    UserModerationService,
    AdminSubmissionsService,
    AdminDashboardService,
    AuditLogsRepository,
    SystemSettingsRepository,
    ModerationReportsRepository,
    FeaturedCurationsRepository,
    AdminUsersRepository,
    AdminContentRepository,
  ],
})
export class AdminModule {}
