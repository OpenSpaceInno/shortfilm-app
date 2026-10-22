import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { AdminSubscriptionsController } from './controllers/admin-subscriptions.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { CheckoutService } from './services/checkout.service';
import { SubscriptionWebhooksService } from './services/subscription-webhooks.service';
import { SubscriptionPlansRepository } from './repositories/subscription-plans.repository';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { EntitlementsRepository } from './repositories/entitlements.repository';
import { PaymentTransactionsRepository } from './repositories/payment-transactions.repository';
import { SubscriptionWebhooksRepository } from './repositories/subscription-webhooks.repository';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { PaymentGatewayAdapter } from './gateways/payment-gateway.adapter';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [
    SubscriptionsController,
    AdminSubscriptionsController,
    WebhooksController,
  ],
  providers: [
    SubscriptionPlansRepository,
    SubscriptionsRepository,
    EntitlementsRepository,
    PaymentTransactionsRepository,
    SubscriptionWebhooksRepository,
    SubscriptionPlansService,
    SubscriptionsService,
    CheckoutService,
    SubscriptionWebhooksService,
    RazorpayGateway,
    StripeGateway,
    MockPaymentGateway,
    PaymentGatewayAdapter,
  ],
  exports: [
    SubscriptionPlansService,
    SubscriptionsService,
    CheckoutService,
    SubscriptionWebhooksService,
    SubscriptionPlansRepository,
    SubscriptionsRepository,
    EntitlementsRepository,
    PaymentTransactionsRepository,
    SubscriptionWebhooksRepository,
    PaymentGatewayAdapter,
  ],
})
export class SubscriptionsModule {}
