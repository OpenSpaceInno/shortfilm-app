import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SearchController } from './controllers/search.controller';
import { MysqlSearchService } from './services/mysql-search.service';
import { SEARCH_SERVICE } from './interfaces/search.interface';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [
    MysqlSearchService,
    {
      provide: SEARCH_SERVICE,
      useClass: MysqlSearchService,
    },
  ],
  exports: [SEARCH_SERVICE, MysqlSearchService],
})
export class SearchModule {}
