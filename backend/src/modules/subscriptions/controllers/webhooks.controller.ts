import {
  Controller,
  Post,
  Headers,
  Req,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { SubscriptionWebhooksService } from '../services/subscription-webhooks.service';
import { WebhookAcknowledgmentDto } from '../dto/webhook-acknowledgment.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Subscriptions Webhooks')
@Controller('subscriptions/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: SubscriptionWebhooksService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Razorpay webhook callback ingestion',
    description:
      'Idempotently ingests and processes payment.captured, order.paid, subscription.charged, and payment.failed events from Razorpay',
  })
  @ApiHeader({
    name: 'x-razorpay-signature',
    description: 'HMAC-SHA256 signature generated using RAZORPAY_WEBHOOK_SECRET',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook acknowledged and processed idempotently',
    type: WebhookAcknowledgmentDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid HMAC signature' })
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request,
    @Body() payload: any,
  ): Promise<WebhookAcknowledgmentDto> {
    const rawBody = this.extractRawBody(req, payload);
    return this.webhooksService.processRazorpayWebhook(rawBody, signature || '', payload);
  }

  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook callback ingestion',
    description:
      'Idempotently ingests and processes invoice.payment_succeeded, checkout.session.completed, and invoice.payment_failed events from Stripe',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe timestamp and signature header (t=...,v1=...)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook acknowledged and processed idempotently',
    type: WebhookAcknowledgmentDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid Stripe signature' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
    @Body() payload: any,
  ): Promise<WebhookAcknowledgmentDto> {
    const rawBody = this.extractRawBody(req, payload);
    return this.webhooksService.processStripeWebhook(rawBody, signature || '', payload);
  }

  private extractRawBody(req: Request, payload: any): string {
    const raw = (req as any).rawBody;
    if (Buffer.isBuffer(raw)) {
      return raw.toString('utf8');
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return JSON.stringify(payload);
  }
}
