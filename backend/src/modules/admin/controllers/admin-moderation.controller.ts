import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserModerationService } from '../services/user-moderation.service';
import {
  QueryAdminUsersDto,
  AdminUserListItemDto,
  AdminUserDetailDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
  CreateModerationReportDto,
  QueryModerationReportsDto,
  ResolveModerationReportDto,
  ModerationReportResponseDto,
} from '../dto/user-moderation.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { Request } from 'express';

@ApiTags('Admin - User Moderation & Governance')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminModerationController {
  constructor(private readonly moderationService: UserModerationService) {}

  @Get('users')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin list all users with search, role and status filters (05_API_SPECIFICATION)' })
  @ApiResponse({ status: 200, type: [AdminUserListItemDto] })
  async listUsers(@Query() query: QueryAdminUsersDto) {
    const result = await this.moderationService.listUsers(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get('users/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin get user detailed profile, roles, permissions, creator info, and violation history' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  async getUserDetail(@Param('id') id: string) {
    const user = await this.moderationService.getUserDetail(id);
    return new ApiResponseDto(user);
  }

  @Patch('users/:id/status')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspend, activate, or delete user account with audit trail (05_API_SPECIFICATION)' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const updated = await this.moderationService.updateUserStatus(id, dto, user, reqInfo);
    return new ApiResponseDto(updated);
  }

  @Put('users/:id/roles')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Grant or revoke roles for user account (Super Admin)' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const updated = await this.moderationService.updateUserRoles(id, dto, user, reqInfo);
    return new ApiResponseDto(updated);
  }

  @Post('moderation/reports')
  @ApiOperation({ summary: 'Submit a content or user violation report' })
  @ApiResponse({ status: 201, type: ModerationReportResponseDto })
  async createReport(
    @Body() dto: CreateModerationReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const report = await this.moderationService.createReport(dto, user?.id);
    return new ApiResponseDto(report);
  }

  @Get('moderation/reports')
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Admin list all moderation queue reports' })
  @ApiResponse({ status: 200, type: [ModerationReportResponseDto] })
  async listReports(@Query() query: QueryModerationReportsDto) {
    const result = await this.moderationService.listReports(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Post('moderation/reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Resolve a moderation report with action (suspend user, remove content, dismiss)' })
  @ApiResponse({ status: 200, type: ModerationReportResponseDto })
  async resolveReport(
    @Param('id') id: string,
    @Body() dto: ResolveModerationReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const resolved = await this.moderationService.resolveReport(id, dto, user, reqInfo);
    return new ApiResponseDto(resolved);
  }
}
