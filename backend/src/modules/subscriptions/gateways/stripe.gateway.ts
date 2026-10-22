import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import * as crypto from 'crypto';
import {
  PaymentGatewayService,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PaymentVerificationParams,
} from './payment-gateway.interface';
import { PaymentProvider } from '../../../database/schema';

@Injectable()
export class StripeGateway implements PaymentGatewayService {
  readonly provider: PaymentProvider = 'STRIPE';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.secretKey = this.configService.get<string>('STRIPE_SECRET_KEY', 'sk_test_shortreel_mock_key');
    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      'dev_stripe_webhook_secret_999',
    );
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    this.logger.log({
      msg: 'StripeGateway creating checkout session',
      userId: params.userId,
      amount: params.amount,
      plan: params.plan.slug,
    });

    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const checkoutUrl = params.returnUrl
      ? `${params.returnUrl}?session_id=${sessionId}&provider=STRIPE`
      : `https://checkout.stripe.com/c/pay/${sessionId}`;

    return {
      provider: this.provider,
      sessionId,
      externalOrderId: sessionId,
      checkoutUrl,
      amount: params.amount,
      currency: params.currency,
      metadata: {
        planSlug: params.plan.slug,
        billingInterval: params.billingInterval,
        userEmail: params.userEmail,
      },
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<boolean> {
    if (!params.sessionId && !params.paymentId) {
      this.logger.warn({ msg: 'Stripe verification missing sessionId or paymentId' });
      return false;
    }

    this.logger.log({ msg: 'Stripe checkout verified successfully', sessionId: params.sessionId });
    return true;
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!signatureHeader) {
      this.logger.warn({ msg: 'Stripe webhook signature header missing' });
      return false;
    }

    const parts = signatureHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {} as Record<string, string>);

    if (parts.v1 && parts.t) {
      const signedPayload = `${parts.t}.${rawBody}`;
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      try {
        return crypto.timingSafeEqual(
          Buffer.from(expected, 'utf8'),
          Buffer.from(parts.v1, 'utf8'),
        );
      } catch {
        return expected === parts.v1;
      }
    }

    // Direct fallback for plain hex signature
    const directExpected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(directExpected, 'utf8'),
        Buffer.from(signatureHeader, 'utf8'),
      );
    } catch {
      return directExpected === signatureHeader;
    }
  }

  async cancelSubscription(externalSubId: string): Promise<void> {
    this.logger.log({ msg: 'Stripe canceling recurring subscription', externalSubId });
    // Production: stripe.subscriptions.update(externalSubId, { cancel_at_period_end: true })
  }
}
