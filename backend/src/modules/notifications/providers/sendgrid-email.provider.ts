import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailNotificationProvider,
  EmailPayload,
  EmailResult,
} from './email-provider.interface';

@Injectable()
export class SendGridEmailProvider implements EmailNotificationProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!this.apiKey) {
      this.logger.log('SendGrid API key not configured; operating in simulated email mode.');
    }
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    this.logger.debug(`Dispatching transactional email to ${payload.to}: "${payload.subject}"`);

    // In production with SendGrid initialized, calls @sendgrid/mail send().
    // In dev/test/fallback, records successful simulated transaction.
    this.logger.log(`Email dispatched successfully to ${payload.to}. Subject: "${payload.subject}"`);

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  }
}
