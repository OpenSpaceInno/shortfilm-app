import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SubscriptionPlansService } from '../services/subscription-plans.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanResponseDto,
  EntitlementMatrixResponseDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('admin-subscriptions')
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'FINANCE', 'CONTENT_ADMIN')
@ApiBearerAuth('JWT-auth')
export class AdminSubscriptionsController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Admin: List all subscription plans with metrics',
    description: 'Returns all subscription plans including active/inactive status and subscriber counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin subscription plans list',
  })
  async getAdminPlans() {
    return this.plansService.getAdminPlans();
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: Create new subscription plan',
    description: 'Creates a new subscription plan with pricing tiers and feature entitlement matrix',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async createPlan(
    @Body() dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.plansService.createPlan(dto);
  }

  @Get('plans/:id')
  @ApiOperation({
    summary: 'Admin: Get subscription plan by ID',
  })
  @ApiParam({ name: 'id', description: 'Plan ULID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan details',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string): Promise<SubscriptionPlanResponseDto> {
    return this.plansService.getPlanById(id);
  }

  @Patch('plans/:id')
  @ApiOperation({
    summary: 'Admin: Update subscription plan',
    description: 'Updates plan pricing, intervals, features, or entitlement matrix',
  })
  @ApiParam({ name: 'id', description: 'Plan ULID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.plansService.updatePlan(id, dto);
  }

  @Patch('plans/:id/status')
  @ApiOperation({
    summary: 'Admin: Toggle subscription plan active status',
  })
  @ApiParam({ name: 'id', description: 'Plan ULID' })
  @ApiResponse({
    status: 200,
    description: 'Plan status toggled',
    type: SubscriptionPlanResponseDto,
  })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.plansService.togglePlanStatus(id, isActive);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Admin: Deactivate subscription plan',
  })
  @ApiParam({ name: 'id', description: 'Plan ULID' })
  @ApiResponse({ status: 204, description: 'Plan deactivated' })
  async deletePlan(@Param('id') id: string): Promise<void> {
    await this.plansService.togglePlanStatus(id, false);
  }

  @Get('matrix')
  @ApiOperation({
    summary: 'Admin: Get feature entitlement rules comparison matrix',
  })
  @ApiResponse({
    status: 200,
    description: 'Entitlement rules matrix',
    type: EntitlementMatrixResponseDto,
  })
  getEntitlementMatrix(): EntitlementMatrixResponseDto {
    return this.plansService.getEntitlementMatrix();
  }
}
