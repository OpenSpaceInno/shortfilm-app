import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StoriesController } from './controllers/stories.controller';
import { SeasonsController } from './controllers/seasons.controller';
import { EpisodesController } from './controllers/episodes.controller';
import { GenresController } from './controllers/genres.controller';
import { StoriesService } from './services/stories.service';
import { SeasonsService } from './services/seasons.service';
import { EpisodesService } from './services/episodes.service';
import { GenresService } from './services/genres.service';
import { StoriesRepository } from './repositories/stories.repository';
import { SeasonsRepository } from './repositories/seasons.repository';
import { EpisodesRepository } from './repositories/episodes.repository';
import { GenresRepository } from './repositories/genres.repository';
import { CreatorsRepository } from './repositories/creators.repository';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    StoriesController,
    SeasonsController,
    EpisodesController,
    GenresController,
  ],
  providers: [
    StoriesService,
    SeasonsService,
    EpisodesService,
    GenresService,
    StoriesRepository,
    SeasonsRepository,
    EpisodesRepository,
    GenresRepository,
    CreatorsRepository,
  ],
  exports: [
    StoriesService,
    SeasonsService,
    EpisodesService,
    GenresService,
    StoriesRepository,
    SeasonsRepository,
    EpisodesRepository,
    GenresRepository,
    CreatorsRepository,
  ],
})
export class ContentModule {}
