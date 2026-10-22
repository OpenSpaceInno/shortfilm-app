import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { DashboardCacheService } from './services/dashboard-cache.service';
import { BusinessRepository } from './repositories/business.repository';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';
import { AdminBusinessController } from './controllers/admin-business.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [BusinessController, AdminBusinessController],
  providers: [DashboardCacheService, BusinessRepository, BusinessService],
  exports: [BusinessService, DashboardCacheService, BusinessRepository],
})
export class BusinessModule {}
