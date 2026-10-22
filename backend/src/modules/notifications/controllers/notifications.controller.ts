import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import {
  NotificationQueryDto,
  PaginatedNotificationsDto,
  UnreadCountDto,
  RegisterDeviceTokenDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  BroadcastNotificationDto,
} from '../dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications inbox for current user' })
  @ApiResponse({ status: 200, description: 'Paginated user notifications' })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ): Promise<ApiResponseDto<PaginatedNotificationsDto>> {
    const result = await this.notificationsService.getUserNotifications(user.id, query);
    return new ApiResponseDto(result);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for badge indicator' })
  @ApiResponse({ status: 200, description: 'Unread notifications count' })
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<UnreadCountDto>> {
    const result = await this.notificationsService.getUnreadCount(user.id);
    return new ApiResponseDto(result);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ success: boolean }>> {
    const result = await this.notificationsService.markAsRead(user.id, id);
    return new ApiResponseDto(result);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<{ markedCount: number }>> {
    const result = await this.notificationsService.markAllAsRead(user.id);
    return new ApiResponseDto(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/dismiss a notification' })
  @ApiResponse({ status: 200, description: 'Notification dismissed' })
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ success: boolean }>> {
    const result = await this.notificationsService.deleteNotification(user.id, id);
    return new ApiResponseDto(result);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register/refresh client push notification token (FCM/APNs)' })
  @ApiResponse({ status: 200, description: 'Device token registered successfully' })
  async registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<ApiResponseDto<{ success: boolean }>> {
    const result = await this.notificationsService.registerDeviceToken(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Unregister device push token upon logout' })
  @ApiResponse({ status: 200, description: 'Device token unregistered' })
  async unregisterDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<ApiResponseDto<{ success: boolean }>> {
    const result = await this.notificationsService.unregisterDeviceToken(user.id, token);
    return new ApiResponseDto(result);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification delivery preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences settings' })
  async getPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<NotificationPreferencesDto>> {
    const result = await this.notificationsService.getPreferences(user.id);
    return new ApiResponseDto(result);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification delivery preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated' })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<ApiResponseDto<NotificationPreferencesDto>> {
    const result = await this.notificationsService.updatePreferences(user.id, dto);
    return new ApiResponseDto(result);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
  @ApiOperation({ summary: 'Broadcast notification to audience (Admin only)' })
  @ApiResponse({ status: 201, description: 'Broadcast dispatched' })
  async broadcast(
    @Body() dto: BroadcastNotificationDto,
  ): Promise<ApiResponseDto<{ success: boolean; targetCount: number; channels: string[] }>> {
    const result = await this.notificationsService.broadcast(dto);
    return new ApiResponseDto(result);
  }
}
