import {
  Controller,
  Get,
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
import { Request } from 'express';
import { GdprComplianceService } from '../services/gdpr-compliance.service';
import {
  GdprAnonymizeUserDto,
  GdprExportResponseDto,
  GdprRetentionStatusDto,
  QueryGdprRequestsDto,
  GdprRequestResponseDto,
} from '../dto/gdpr.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('Admin - Compliance & GDPR (M29)')
@Controller('admin/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class GdprComplianceController {
  constructor(private readonly gdprService: GdprComplianceService) {}

  @Post('gdpr/anonymize/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'GDPR Right to Erasure / Anonymization (Article 17)',
    description: 'Irreversibly scrubs all PII from the user account, keeping interactive stats anonymously',
  })
  async anonymizeUser(
    @Param('userId') userId: string,
    @Body() dto: GdprAnonymizeUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.gdprService.anonymizeUser(userId, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Post('gdpr/export/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'GDPR Subject Access Request (SAR) Data Export (Article 20)',
    description: 'Compiles and returns all personal profile, creator, subscription, and choice data for user',
  })
  @ApiResponse({ status: 200, type: GdprExportResponseDto })
  async exportUserData(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.gdprService.exportUserData(userId, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Get('gdpr/requests')
  @ApiOperation({ summary: 'List GDPR compliance data subject requests' })
  @ApiResponse({ status: 200, type: [GdprRequestResponseDto] })
  async listGdprRequests(@Query() query: QueryGdprRequestsDto) {
    const result = await this.gdprService.listGdprRequests(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: query.page || 1,
      limit: query.limit || 20,
    });
  }

  @Get('retention-status')
  @ApiOperation({ summary: 'Data retention status & compliance audit readiness report' })
  @ApiResponse({ status: 200, type: GdprRetentionStatusDto })
  async getRetentionStatus() {
    const status = await this.gdprService.getRetentionStatus();
    return new ApiResponseDto(status);
  }
}
