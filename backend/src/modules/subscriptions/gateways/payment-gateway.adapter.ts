import { Injectable, BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  PaymentGatewayService,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PaymentVerificationParams,
} from './payment-gateway.interface';
import { RazorpayGateway } from './razorpay.gateway';
import { StripeGateway } from './stripe.gateway';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentProvider } from '../../../database/schema';

@Injectable()
export class PaymentGatewayAdapter {
  private readonly gatewayMap = new Map<PaymentProvider, PaymentGatewayService>();

  constructor(
    private readonly razorpayGateway: RazorpayGateway,
    private readonly stripeGateway: StripeGateway,
    private readonly mockGateway: MockPaymentGateway,
    private readonly logger: Logger,
  ) {
    this.gatewayMap.set('RAZORPAY', this.razorpayGateway);
    this.gatewayMap.set('STRIPE', this.stripeGateway);
    this.gatewayMap.set('MANUAL', this.mockGateway);
  }

  getGateway(provider: PaymentProvider = 'RAZORPAY'): PaymentGatewayService {
    const gateway = this.gatewayMap.get(provider);
    if (!gateway) {
      this.logger.warn({ msg: `Unsupported payment provider: ${provider}, falling back to RAZORPAY` });
      return this.razorpayGateway;
    }
    return gateway;
  }

  async createCheckoutSession(
    provider: PaymentProvider,
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    const gateway = this.getGateway(provider);
    return gateway.createCheckoutSession(params);
  }

  async verifyPayment(
    provider: PaymentProvider,
    params: PaymentVerificationParams,
  ): Promise<boolean> {
    const gateway = this.getGateway(provider);
    return gateway.verifyPayment(params);
  }

  verifyWebhookSignature(
    provider: PaymentProvider,
    rawBody: string,
    signature: string,
  ): boolean {
    const gateway = this.getGateway(provider);
    if (!gateway.verifyWebhookSignature) {
      return true;
    }
    return gateway.verifyWebhookSignature(rawBody, signature);
  }

  async cancelSubscription(provider: PaymentProvider, externalSubId: string): Promise<void> {
    const gateway = this.getGateway(provider);
    return gateway.cancelSubscription(externalSubId);
  }
}
