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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemSettingsService } from '../services/system-settings.service';
import {
  UpdateSettingDto,
  BatchUpdateSettingsDto,
  SettingResponseDto,
  QuerySettingsDto,
} from '../dto/system-settings.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { Request } from 'express';

@ApiTags('Admin - System Settings')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Get public platform settings and active feature flags',
    description: 'Accessible by clients without admin credentials for maintenance and feature switches',
  })
  @ApiResponse({ status: 200, description: 'Public platform settings map' })
  async getPublicSettings(): Promise<ApiResponseDto<Record<string, any>>> {
    const settings = await this.settingsService.getPublicSettings();
    return new ApiResponseDto(settings);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all system settings (Super Admin)' })
  @ApiResponse({ status: 200, type: [SettingResponseDto] })
  async getAllSettings(@Query() query: QuerySettingsDto): Promise<ApiResponseDto<SettingResponseDto[]>> {
    const list = await this.settingsService.getAllSettings(query.category);
    return new ApiResponseDto(list);
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single setting by key (Super Admin)' })
  @ApiResponse({ status: 200, type: SettingResponseDto })
  async getSettingByKey(@Param('key') key: string): Promise<ApiResponseDto<SettingResponseDto>> {
    const setting = await this.settingsService.getSettingByKey(key);
    return new ApiResponseDto(setting);
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system setting with audit log (Super Admin)' })
  @ApiResponse({ status: 200, type: SettingResponseDto })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SettingResponseDto>> {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const updated = await this.settingsService.updateSetting(key, dto, user, reqInfo);
    return new ApiResponseDto(updated);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch update multiple system settings atomically (Super Admin)' })
  @ApiResponse({ status: 200, type: [SettingResponseDto] })
  async batchUpdate(
    @Body() dto: BatchUpdateSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SettingResponseDto[]>> {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const list = await this.settingsService.batchUpdateSettings(dto, user, reqInfo);
    return new ApiResponseDto(list);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset platform settings to system defaults (Super Admin)' })
  @ApiResponse({ status: 200, type: [SettingResponseDto] })
  async resetToDefaults(
    @Query('category') category: any,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<ApiResponseDto<SettingResponseDto[]>> {
    const reqInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'] as string,
    };
    const list = await this.settingsService.resetToDefaults(category, user, reqInfo);
    return new ApiResponseDto(list);
  }
}
