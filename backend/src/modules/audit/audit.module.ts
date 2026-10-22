import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Repositories
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { GdprRequestsRepository } from './repositories/gdpr-requests.repository';

// Services
import { AuditService } from './services/audit.service';
import { GdprComplianceService } from './services/gdpr-compliance.service';

// Interceptor
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';

// Controllers
import { AuditController } from './controllers/audit.controller';
import { GdprComplianceController } from './controllers/gdpr-compliance.controller';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuditController, GdprComplianceController],
  providers: [
    AuditLogsRepository,
    GdprRequestsRepository,
    AuditService,
    GdprComplianceService,
    AuditLoggingInterceptor,
  ],
  exports: [
    AuditLogsRepository,
    GdprRequestsRepository,
    AuditService,
    GdprComplianceService,
    AuditLoggingInterceptor,
  ],
})
export class AuditModule {}
