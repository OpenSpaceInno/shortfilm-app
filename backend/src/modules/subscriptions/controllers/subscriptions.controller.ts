import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SubscriptionPlansService } from '../services/subscription-plans.service';
import { SubscriptionsService } from '../services/subscriptions.service';
import { CheckoutService } from '../services/checkout.service';
import {
  PlanQueryDto,
  SubscriptionPlanResponseDto,
  EntitlementMatrixResponseDto,
  CurrentSubscriptionResponseDto,
  InitiateCheckoutDto,
  CheckoutSessionResponseDto,
  VerifyCheckoutDto,
  CheckoutVerificationResponseDto,
  CancelSubscriptionDto,
  CancellationResponseDto,
} from '../dto';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly plansService: SubscriptionPlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({
    summary: 'List subscription plans catalog',
    description:
      'Returns active subscription plans, pricing tiers, billing intervals (monthly/annual), and feature entitlement matrices',
  })
  @ApiResponse({
    status: 200,
    description: 'Active subscription plans catalog',
    type: [SubscriptionPlanResponseDto],
  })
  async getPlans(@Query() query: PlanQueryDto): Promise<SubscriptionPlanResponseDto[]> {
    return this.plansService.getActivePlans(query);
  }

  @Public()
  @Get('plans/:slug')
  @ApiOperation({
    summary: 'Get subscription plan details by slug',
    description: 'Retrieves pricing tiers, intervals, and entitlement matrix for a specific plan',
  })
  @ApiParam({ name: 'slug', description: 'Unique slug identifier (e.g. vip-annual, vip-monthly)' })
  @ApiResponse({
    status: 200,
    description: 'Plan details found',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanBySlug(@Param('slug') slug: string): Promise<SubscriptionPlanResponseDto> {
    return this.plansService.getPlanBySlug(slug);
  }

  @Public()
  @Get('matrix')
  @ApiOperation({
    summary: 'Get feature entitlement comparison matrix',
    description:
      'Returns side-by-side entitlement comparison matrix across Free, VIP Monthly, VIP Annual, and Student VIP tiers',
  })
  @ApiResponse({
    status: 200,
    description: 'Entitlement feature comparison matrix',
    type: EntitlementMatrixResponseDto,
  })
  getEntitlementMatrix(): EntitlementMatrixResponseDto {
    return this.plansService.getEntitlementMatrix();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Get current authenticated user's subscription and entitlements",
    description:
      'Returns the user subscription state (ACTIVE, TRIAL, PAST_DUE, CANCELLED), VIP status, and granted entitlements',
  })
  @ApiResponse({
    status: 200,
    description: 'User subscription profile',
    type: CurrentSubscriptionResponseDto,
  })
  async getCurrentSubscription(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CurrentSubscriptionResponseDto> {
    return this.subscriptionsService.getCurrentUserSubscription(user.id);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate subscription checkout session',
    description:
      'Creates a pending subscription and external payment gateway checkout session (Razorpay order, Stripe session, or instant mock)',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created successfully',
    type: CheckoutSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Already subscribed to plan' })
  async initiateCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateCheckoutDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.checkoutService.initiateCheckout(user.id, user.email, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify checkout payment completion',
    description:
      'Validates gateway order signature or session confirmation, transitions subscription to ACTIVE, and provisions VIP entitlements',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified and VIP entitlements provisioned',
    type: CheckoutVerificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Payment verification failed' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async verifyCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyCheckoutDto,
  ): Promise<CheckoutVerificationResponseDto> {
    return this.checkoutService.verifyCheckout(user.id, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel recurring subscription',
    description:
      'Turns off auto-renewal on payment gateway and marks subscription CANCELLED, keeping VIP access active until period end',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    type: CancellationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No active subscription found to cancel' })
  async cancelSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelSubscriptionDto,
  ): Promise<CancellationResponseDto> {
    return this.checkoutService.cancelSubscription(user.id, dto);
  }
}
