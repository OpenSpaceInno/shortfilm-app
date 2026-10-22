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
import { AdminSubmissionsService } from '../services/admin-submissions.service';
import {
  AdminSubmissionQueryDto,
  AdminApproveSubmissionDto,
  AdminRejectSubmissionDto,
  AdminRequestChangesDto,
} from '../dto/admin-submissions.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { Request } from 'express';

@ApiTags('Admin - Submissions Queue')
@Controller('admin/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminSubmissionsController {
  constructor(private readonly submissionsService: AdminSubmissionsService) {}

  @Get()
  @Roles('CONTENT_ADMIN', 'EDITOR', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List creator submissions in editorial review queue (05_API_SPECIFICATION)' })
  async listSubmissions(@Query() query: AdminSubmissionQueryDto) {
    const result = await this.submissionsService.listSubmissions(query);
    return new ApiResponseDto(result);
  }

  @Get(':id')
  @Roles('CONTENT_ADMIN', 'EDITOR', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get full submission details and checklist' })
  async getSubmission(@Param('id') id: string) {
    const result = await this.submissionsService.getSubmissionById(id);
    return new ApiResponseDto(result);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve submission and optionally publish immediately (05_API_SPECIFICATION)' })
  async approveSubmission(
    @Param('id') id: string,
    @Body() dto: AdminApproveSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.submissionsService.approveSubmission(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject submission with mandatory rationale (05_API_SPECIFICATION)' })
  async rejectSubmission(
    @Param('id') id: string,
    @Body() dto: AdminRejectSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.submissionsService.rejectSubmission(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.OK)
  @Roles('CONTENT_ADMIN', 'EDITOR', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Request changes on submission with feedback checklist' })
  async requestChanges(
    @Param('id') id: string,
    @Body() dto: AdminRequestChangesDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const result = await this.submissionsService.requestChanges(id, dto, user, reqInfo);
    return new ApiResponseDto(result);
  }
}
