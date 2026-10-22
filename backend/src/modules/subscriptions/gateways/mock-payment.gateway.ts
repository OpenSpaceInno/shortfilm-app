import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  PaymentGatewayService,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PaymentVerificationParams,
} from './payment-gateway.interface';
import { PaymentProvider } from '../../../database/schema';

@Injectable()
export class MockPaymentGateway implements PaymentGatewayService {
  readonly provider: PaymentProvider = 'MANUAL';

  constructor(private readonly logger: Logger) {}

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    this.logger.log({
      msg: 'MockPaymentGateway creating simulated checkout session',
      userId: params.userId,
      amount: params.amount,
      plan: params.plan.slug,
    });

    const sessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const checkoutUrl = params.returnUrl
      ? `${params.returnUrl}?session_id=${sessionId}&provider=MANUAL&status=success`
      : `/plans?mock_checkout=success&session_id=${sessionId}`;

    return {
      provider: this.provider,
      sessionId,
      externalOrderId: `mock_order_${Date.now()}`,
      checkoutUrl,
      amount: params.amount,
      currency: params.currency,
      metadata: {
        isMock: true,
        planSlug: params.plan.slug,
        billingInterval: params.billingInterval,
      },
    };
  }

  async verifyPayment(_params: PaymentVerificationParams): Promise<boolean> {
    this.logger.log({ msg: 'MockPaymentGateway verified instant simulated checkout' });
    return true;
  }

  async cancelSubscription(externalSubId: string): Promise<void> {
    this.logger.log({ msg: 'MockPaymentGateway cancelled simulated subscription', externalSubId });
  }
}
