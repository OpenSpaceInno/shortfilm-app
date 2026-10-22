import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { VideosController } from './controllers/videos.controller';
import { VideosService } from './services/videos.service';
import { VideosRepository } from './repositories/videos.repository';
import { WebhookEventsRepository } from './repositories/webhook-events.repository';
import { CloudflareStreamProvider } from './providers/cloudflare-stream.provider';
import { VIDEO_PROVIDER } from './interfaces/video-provider.interface';

@Module({
  imports: [DatabaseModule, AuthModule, ContentModule],
  controllers: [VideosController],
  providers: [
    VideosService,
    VideosRepository,
    WebhookEventsRepository,
    CloudflareStreamProvider,
    {
      provide: VIDEO_PROVIDER,
      useClass: CloudflareStreamProvider,
    },
  ],
  exports: [
    VideosService,
    VideosRepository,
    WebhookEventsRepository,
    VIDEO_PROVIDER,
  ],
})
export class VideosModule {}
