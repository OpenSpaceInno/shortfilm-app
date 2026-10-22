import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ description: 'Notification ULID' })
  id: string;

  @ApiProperty({ description: 'Recipient user ULID' })
  userId: string;

  @ApiProperty({ description: 'Notification event type category' })
  type: string;

  @ApiProperty({ description: 'Notification title header' })
  title: string;

  @ApiProperty({ description: 'Notification descriptive message body' })
  body: string;

  @ApiPropertyOptional({ description: 'Related entity type (e.g. Story, Episode, Badge, Choice, Prediction)', nullable: true })
  referenceType?: string | null;

  @ApiPropertyOptional({ description: 'Related entity ULID', nullable: true })
  referenceId?: string | null;

  @ApiPropertyOptional({ description: 'Additional structured metadata (deepLink, thumbnail, xp, etc.)', nullable: true })
  data?: Record<string, any> | null;

  @ApiProperty({ description: 'Whether the notification has been marked as read' })
  isRead: boolean;

  @ApiPropertyOptional({ description: 'Timestamp when notification was read', nullable: true })
  readAt?: Date | null;

  @ApiProperty({ description: 'Timestamp when notification was created' })
  createdAt: Date;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ description: 'List of notification items', type: [NotificationDto] })
  items: NotificationDto[];

  @ApiProperty({ description: 'Total count of notifications matching query' })
  total: number;

  @ApiProperty({ description: 'Total unread notifications count for user' })
  unreadCount: number;

  @ApiProperty({ description: 'Whether additional pages are available' })
  hasMore: boolean;
}

export class UnreadCountDto {
  @ApiProperty({ description: 'Total unread notifications count for current user' })
  unreadCount: number;
}
