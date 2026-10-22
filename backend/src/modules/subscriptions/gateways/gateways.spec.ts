import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import * as crypto from 'crypto';
import { PaymentGatewayAdapter } from './payment-gateway.adapter';
import { RazorpayGateway } from './razorpay.gateway';
import { StripeGateway } from './stripe.gateway';
import { MockPaymentGateway } from './mock-payment.gateway';
import { CheckoutSessionParams } from './payment-gateway.interface';
import { SubscriptionPlan } from '../../../database/schema';

describe('Payment Gateways & Adapter', () => {
  let adapter: PaymentGatewayAdapter;
  let razorpayGateway: RazorpayGateway;
  let stripeGateway: StripeGateway;
  let mockGateway: MockPaymentGateway;

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key_123';
      if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_secret_999';
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_stripe_secret';
      return defaultVal;
    }),
  };

  const samplePlan: SubscriptionPlan = {
    id: 'plan_01',
    name: 'VIP Annual',
    slug: 'vip-annual',
    tier: 'VIP',
    description: 'VIP test plan',
    priceMonthly: '83.25',
    priceAnnually: '999.00',
    currency: 'INR',
    billingInterval: 'ANNUAL',
    trialDays: 7,
    features: ['All VIP Perks'],
    entitlementMatrix: {
      adFree: true,
      maxResolution: '1080p',
      earlyAccessHours: 48,
      exclusiveChoices: true,
      offlineDownloads: true,
      unlimitedEpisodes: true,
      maxConcurrentDevices: 2,
      predictionXpMultiplier: 2,
    },
    isActive: true,
    isPopular: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sessionParams: CheckoutSessionParams = {
    userId: 'user_01',
    userEmail: 'user@test.com',
    plan: samplePlan,
    billingInterval: 'ANNUAL',
    amount: 999,
    currency: 'INR',
    returnUrl: 'http://localhost:8081/plans',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewayAdapter,
        RazorpayGateway,
        StripeGateway,
        MockPaymentGateway,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    adapter = module.get<PaymentGatewayAdapter>(PaymentGatewayAdapter);
    razorpayGateway = module.get<RazorpayGateway>(RazorpayGateway);
    stripeGateway = module.get<StripeGateway>(StripeGateway);
    mockGateway = module.get<MockPaymentGateway>(MockPaymentGateway);

    jest.clearAllMocks();
  });

  describe('RazorpayGateway', () => {
    it('should create a checkout session with valid orderId, sessionId and metadata', async () => {
      const result = await razorpayGateway.createCheckoutSession(sessionParams);

      expect(result.provider).toBe('RAZORPAY');
      expect(result.externalOrderId).toMatch(/^order_rzp_/);
      expect(result.sessionId).toMatch(/^sess_rzp_/);
      expect(result.checkoutUrl).toContain('order_id=');
      expect(result.amount).toBe(999);
      expect(result.currency).toBe('INR');
      expect(result.metadata?.keyId).toBe('rzp_test_key_123');
      expect(result.metadata?.amountInPaise).toBe(99900);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should create checkout url fallback when returnUrl is omitted', async () => {
      const paramsWithoutReturnUrl = { ...sessionParams, returnUrl: undefined };
      const result = await razorpayGateway.createCheckoutSession(paramsWithoutReturnUrl);

      expect(result.checkoutUrl).toContain('https://api.razorpay.com/v1/checkout/hosted?order_id=');
    });

    it('should verify payment successfully with valid HMAC SHA256 signature', async () => {
      const orderId = 'order_test_123';
      const paymentId = 'pay_test_456';
      const signature = crypto
        .createHmac('sha256', 'rzp_test_secret_999')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = await razorpayGateway.verifyPayment({
        orderId,
        paymentId,
        signature,
      });

      expect(isValid).toBe(true);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Razorpay payment verified successfully' }),
      );
    });

    it('should reject verification when orderId or paymentId is missing', async () => {
      const result = await razorpayGateway.verifyPayment({
        orderId: '',
        paymentId: 'pay_test_456',
      });

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Razorpay verification missing orderId or paymentId' }),
      );
    });

    it('should verify webhook signature correctly with HMAC SHA256', () => {
      const payload = '{"event":"payment.captured"}';
      const signature = crypto
        .createHmac('sha256', 'dev_razorpay_webhook_secret_999')
        .update(payload)
        .digest('hex');

      expect(razorpayGateway.verifyWebhookSignature(payload, signature)).toBe(true);
      expect(razorpayGateway.verifyWebhookSignature(payload, 'wrong_signature')).toBe(false);
      expect(razorpayGateway.verifyWebhookSignature(payload, '')).toBe(false);
    });

    it('should handle cancelSubscription gracefully', async () => {
      await expect(razorpayGateway.cancelSubscription('sub_rzp_999')).resolves.not.toThrow();
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Razorpay canceling recurring subscription' }),
      );
    });
  });

  describe('StripeGateway', () => {
    it('should create a Stripe checkout session with custom returnUrl', async () => {
      const result = await stripeGateway.createCheckoutSession(sessionParams);

      expect(result.provider).toBe('STRIPE');
      expect(result.sessionId).toMatch(/^cs_test_/);
      expect(result.checkoutUrl).toContain('session_id=');
      expect(result.amount).toBe(999);
      expect(result.metadata?.userEmail).toBe('user@test.com');
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should fallback to hosted Stripe checkout URL if returnUrl is omitted', async () => {
      const result = await stripeGateway.createCheckoutSession({
        ...sessionParams,
        returnUrl: undefined,
      });

      expect(result.checkoutUrl).toContain('https://checkout.stripe.com/c/pay/');
    });

    it('should verify payment successfully when sessionId is present', async () => {
      const isValid = await stripeGateway.verifyPayment({
        sessionId: 'cs_test_session_123',
      });

      expect(isValid).toBe(true);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Stripe checkout verified successfully' }),
      );
    });

    it('should reject verification when neither sessionId nor paymentId is provided', async () => {
      const isValid = await stripeGateway.verifyPayment({});

      expect(isValid).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Stripe verification missing sessionId or paymentId' }),
      );
    });

    it('should verify Stripe webhook signatures with t= and v1= components', () => {
      const payload = '{"id":"evt_123"}';
      const timestamp = '1612345678';
      const signedPayload = `${timestamp}.${payload}`;
      const v1Sig = crypto
        .createHmac('sha256', 'dev_stripe_webhook_secret_999')
        .update(signedPayload)
        .digest('hex');

      const header = `t=${timestamp},v1=${v1Sig}`;
      expect(stripeGateway.verifyWebhookSignature(payload, header)).toBe(true);
      expect(stripeGateway.verifyWebhookSignature(payload, 't=123,v1=wrong_sig')).toBe(false);
      expect(stripeGateway.verifyWebhookSignature(payload, '')).toBe(false);
    });

    it('should verify Stripe webhook signatures in direct hex format', () => {
      const payload = '{"id":"evt_direct"}';
      const directSig = crypto
        .createHmac('sha256', 'dev_stripe_webhook_secret_999')
        .update(payload)
        .digest('hex');

      expect(stripeGateway.verifyWebhookSignature(payload, directSig)).toBe(true);
      expect(stripeGateway.verifyWebhookSignature(payload, 'wrong_hex')).toBe(false);
    });

    it('should handle cancelSubscription without error', async () => {
      await expect(stripeGateway.cancelSubscription('sub_stripe_123')).resolves.not.toThrow();
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'Stripe canceling recurring subscription' }),
      );
    });
  });

  describe('MockPaymentGateway', () => {
    it('should create instant simulated session and returnUrl callback', async () => {
      const result = await mockGateway.createCheckoutSession(sessionParams);

      expect(result.provider).toBe('MANUAL');
      expect(result.sessionId).toMatch(/^mock_sess_/);
      expect(result.checkoutUrl).toContain('status=success');
      expect(result.metadata?.isMock).toBe(true);
    });

    it('should verify payment immediately', async () => {
      const isValid = await mockGateway.verifyPayment({ paymentId: 'mock_pay_1' });
      expect(isValid).toBe(true);
    });

    it('should handle mock cancelSubscription', async () => {
      await expect(mockGateway.cancelSubscription('mock_sub_1')).resolves.not.toThrow();
    });
  });

  describe('PaymentGatewayAdapter', () => {
    it('should route to Razorpay when provider is RAZORPAY or default', () => {
      expect(adapter.getGateway('RAZORPAY')).toBe(razorpayGateway);
      expect(adapter.getGateway()).toBe(razorpayGateway);
    });

    it('should route to Stripe when provider is STRIPE', () => {
      expect(adapter.getGateway('STRIPE')).toBe(stripeGateway);
    });

    it('should route to MockGateway when provider is MANUAL', () => {
      expect(adapter.getGateway('MANUAL')).toBe(mockGateway);
    });

    it('should warn and fall back to Razorpay if unknown provider passed', () => {
      const gateway = adapter.getGateway('UNKNOWN_PROVIDER' as any);
      expect(gateway).toBe(razorpayGateway);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should delegate createCheckoutSession, verifyPayment, and cancelSubscription through adapter', async () => {
      const createSpy = jest.spyOn(razorpayGateway, 'createCheckoutSession');
      const verifySpy = jest.spyOn(stripeGateway, 'verifyPayment');
      const cancelSpy = jest.spyOn(mockGateway, 'cancelSubscription');

      await adapter.createCheckoutSession('RAZORPAY', sessionParams);
      expect(createSpy).toHaveBeenCalledWith(sessionParams);

      await adapter.verifyPayment('STRIPE', { sessionId: 'cs_123' });
      expect(verifySpy).toHaveBeenCalledWith({ sessionId: 'cs_123' });

      await adapter.cancelSubscription('MANUAL', 'mock_sub_99');
      expect(cancelSpy).toHaveBeenCalledWith('mock_sub_99');
    });

    it('should delegate verifyWebhookSignature through adapter or return true for MANUAL', () => {
      const razorpaySpy = jest.spyOn(razorpayGateway, 'verifyWebhookSignature');
      adapter.verifyWebhookSignature('RAZORPAY', '{}', 'sig_rzp');
      expect(razorpaySpy).toHaveBeenCalledWith('{}', 'sig_rzp');

      const manualResult = adapter.verifyWebhookSignature('MANUAL', '{}', 'sig');
      expect(manualResult).toBe(true);
    });
  });
});
