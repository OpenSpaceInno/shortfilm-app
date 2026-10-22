import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationSettingsRepository } from './repositories/notification-settings.repository';
import { PUSH_PROVIDER } from './providers/push-provider.interface';
import { FcmPushProvider } from './providers/fcm-push.provider';
import { EMAIL_PROVIDER } from './providers/email-provider.interface';
import { SendGridEmailProvider } from './providers/sendgrid-email.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    DeviceTokensRepository,
    NotificationSettingsRepository,
    {
      provide: PUSH_PROVIDER,
      useClass: FcmPushProvider,
    },
    {
      provide: EMAIL_PROVIDER,
      useClass: SendGridEmailProvider,
    },
    NotificationsService,
  ],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
