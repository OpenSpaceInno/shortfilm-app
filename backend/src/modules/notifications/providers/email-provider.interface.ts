export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

export interface EmailNotificationProvider {
  sendEmail(payload: EmailPayload): Promise<EmailResult>;
}
