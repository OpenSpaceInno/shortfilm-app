import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { NotificationSettingsRepository } from '../repositories/notification-settings.repository';
import {
  PUSH_PROVIDER,
  PushNotificationProvider,
} from '../providers/push-provider.interface';
import {
  EMAIL_PROVIDER,
  EmailNotificationProvider,
} from '../providers/email-provider.interface';
import {
  NotificationQueryDto,
  PaginatedNotificationsDto,
  NotificationDto,
  UnreadCountDto,
  RegisterDeviceTokenDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  BroadcastNotificationDto,
} from '../dto';
import { Notification } from '../../../database/schema';

export interface DispatchNotificationOptions {
  type: string;
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
  data?: Record<string, any> | null;
  channels?: Array<'IN_APP' | 'PUSH' | 'EMAIL'>;
  emailRecipient?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepo: NotificationsRepository,
    private readonly deviceTokensRepo: DeviceTokensRepository,
    private readonly settingsRepo: NotificationSettingsRepository,
    @Inject(PUSH_PROVIDER)
    private readonly pushProvider: PushNotificationProvider,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailNotificationProvider,
  ) {}

  /**
   * Get paginated user notifications ledger
   */
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const [records, unreadCount] = await Promise.all([
      this.notificationsRepo.findByUserId(userId, {
        unreadOnly: query.unreadOnly,
        limit,
        offset,
      }),
      this.notificationsRepo.getUnreadCount(userId),
    ]);

    const items: NotificationDto[] = records.items.map((r) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      title: r.title,
      body: r.body,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      data: r.data,
      isRead: r.isRead,
      readAt: r.readAt,
      createdAt: r.createdAt,
    }));

    return {
      items,
      total: records.total,
      unreadCount,
      hasMore: offset + items.length < records.total,
    };
  }

  /**
   * Fast unread notification counter for app bell badge
   */
  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const unreadCount = await this.notificationsRepo.getUnreadCount(userId);
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const notification = await this.notificationsRepo.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID '${notificationId}' not found`);
    }

    const success = await this.notificationsRepo.markAsRead(notificationId, userId);
    return { success };
  }

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const markedCount = await this.notificationsRepo.markAllAsRead(userId);
    return { markedCount };
  }

  /**
   * Delete / dismiss an in-app notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const notification = await this.notificationsRepo.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID '${notificationId}' not found`);
    }

    const success = await this.notificationsRepo.delete(notificationId, userId);
    return { success };
  }

  /**
   * Register or refresh user device push token (FCM / APNs)
   */
  async registerDeviceToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean }> {
    await this.deviceTokensRepo.upsertToken(userId, dto.token, dto.platform);
    return { success: true };
  }

  /**
   * Unregister user device push token on logout
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<{ success: boolean }> {
    const success = await this.deviceTokensRepo.removeToken(userId, token);
    return { success };
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const settings = await this.settingsRepo.getSettings(userId);
    return {
      inAppEnabled: settings.inAppEnabled,
      pushEnabled: settings.pushEnabled,
      emailEnabled: settings.emailEnabled,
      episodesEnabled: settings.episodesEnabled,
      votingEnabled: settings.votingEnabled,
      streaksEnabled: settings.streaksEnabled,
      rewardsEnabled: settings.rewardsEnabled,
      marketingEnabled: settings.marketingEnabled,
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const updated = await this.settingsRepo.updateSettings(userId, dto);
    return {
      inAppEnabled: updated.inAppEnabled,
      pushEnabled: updated.pushEnabled,
      emailEnabled: updated.emailEnabled,
      episodesEnabled: updated.episodesEnabled,
      votingEnabled: updated.votingEnabled,
      streaksEnabled: updated.streaksEnabled,
      rewardsEnabled: updated.rewardsEnabled,
      marketingEnabled: updated.marketingEnabled,
    };
  }

  /**
   * Core notification dispatch engine.
   * Evaluates user preferences, creates in-app record, and fans out to push/email.
   */
  async dispatchNotification(
    recipientUserId: string,
    options: DispatchNotificationOptions,
  ): Promise<Notification | null> {
    const settings = await this.settingsRepo.getSettings(recipientUserId);

    // Evaluate preference categories
    if (
      (options.type === 'EPISODE_PUBLISHED' || options.type === 'STORY_PUBLISHED') &&
      !settings.episodesEnabled
    ) {
      return null;
    }
    if (
      (options.type === 'VOTE_RESULT' || options.type === 'CHOICE_REMINDER') &&
      !settings.votingEnabled
    ) {
      return null;
    }
    if (options.type === 'STREAK_REMINDER' && !settings.streaksEnabled) {
      return null;
    }
    if (
      (options.type === 'BADGE_UNLOCKED' ||
        options.type === 'XP_MILESTONE' ||
        options.type === 'PREDICTION_RESOLVED') &&
      !settings.rewardsEnabled
    ) {
      return null;
    }

    const channels = options.channels || ['IN_APP', 'PUSH'];
    let sentPush = false;
    let sentEmail = false;

    // 1. Dispatch Push if requested and enabled
    if (channels.includes('PUSH') && settings.pushEnabled) {
      const tokens = await this.deviceTokensRepo.findTokensByUserId(recipientUserId);
      if (tokens.length > 0) {
        try {
          const pushResult = await this.pushProvider.sendPush(tokens, {
            title: options.title,
            body: options.body,
            data: options.data || undefined,
          });
          sentPush = pushResult.successCount > 0;
        } catch (err) {
          this.logger.warn(`Push dispatch failed for user ${recipientUserId}: ${err}`);
        }
      }
    }

    // 2. Dispatch Email if requested and enabled
    if (channels.includes('EMAIL') && settings.emailEnabled && options.emailRecipient) {
      try {
        const emailResult = await this.emailProvider.sendEmail({
          to: options.emailRecipient,
          subject: options.title,
          html: `<p>${options.body}</p>`,
          text: options.body,
          dynamicTemplateData: options.data || undefined,
        });
        sentEmail = emailResult.success;
      } catch (err) {
        this.logger.warn(`Email dispatch failed for user ${recipientUserId}: ${err}`);
      }
    }

    // 3. Persist In-App Notification if requested and enabled
    let createdNotification: Notification | null = null;
    if (channels.includes('IN_APP') && settings.inAppEnabled) {
      createdNotification = await this.notificationsRepo.create({
        userId: recipientUserId,
        type: options.type,
        title: options.title,
        body: options.body,
        referenceType: options.referenceType,
        referenceId: options.referenceId,
        data: options.data,
        sentPush,
        sentEmail,
      });
    }

    return createdNotification;
  }

  /**
   * Admin broadcast notification dispatch
   */
  async broadcast(
    dto: BroadcastNotificationDto,
  ): Promise<{ success: boolean; targetCount: number; channels: string[] }> {
    const channelMode = dto.channel || 'IN_APP';
    const channels: Array<'IN_APP' | 'PUSH' | 'EMAIL'> =
      channelMode === 'ALL'
        ? ['IN_APP', 'PUSH', 'EMAIL']
        : [channelMode as 'IN_APP' | 'PUSH' | 'EMAIL'];

    this.logger.log(
      `Broadcasting notification: "${dto.title}" across channels: ${channels.join(', ')}`,
    );

    // If PUSH is one of the channels, dispatch push to active device tokens
    let pushedCount = 0;
    if (channels.includes('PUSH')) {
      // Broadcast push can target all known registered tokens
      const result = await this.pushProvider.sendPush([], {
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });
      pushedCount = result.successCount;
    }

    return {
      success: true,
      targetCount: pushedCount,
      channels,
    };
  }

  // --- Convenience Domain Trigger Methods ---

  async notifyBadgeUnlocked(userId: string, badgeName: string, xpReward: number) {
    return this.dispatchNotification(userId, {
      type: 'BADGE_UNLOCKED',
      title: 'New Badge Unlocked! 🏆',
      body: `Congratulations! You unlocked the "${badgeName}" badge and earned +${xpReward} XP!`,
      data: { badgeName, xpReward },
      channels: ['IN_APP', 'PUSH'],
    });
  }

  async notifyXpMilestone(userId: string, totalXp: number) {
    return this.dispatchNotification(userId, {
      type: 'XP_MILESTONE',
      title: 'Milestone Reached! 🌟',
      body: `You've reached ${totalXp} XP! Keep exploring story paths to level up.`,
      data: { totalXp },
      channels: ['IN_APP'],
    });
  }

  async notifyStreakReminder(userId: string, streakDays: number) {
    return this.dispatchNotification(userId, {
      type: 'STREAK_REMINDER',
      title: 'Keep Your Streak Alive! 🔥',
      body: `Your ${streakDays}-day streak is on the line! Watch an episode before midnight to maintain it.`,
      data: { streakDays },
      channels: ['IN_APP', 'PUSH'],
    });
  }

  async notifyPredictionResolved(
    userId: string,
    question: string,
    isCorrect: boolean,
    xpAwarded: number,
  ) {
    const title = isCorrect ? 'Prediction Correct! 🎉' : 'Prediction Resolved 🎬';
    const body = isCorrect
      ? `Your prediction for "${question}" was correct! You earned +${xpAwarded} XP.`
      : `The outcome for "${question}" was revealed. Try again on the next episode!`;

    return this.dispatchNotification(userId, {
      type: 'PREDICTION_RESOLVED',
      title,
      body,
      data: { question, isCorrect, xpAwarded },
      channels: ['IN_APP', 'PUSH'],
    });
  }

  async notifyVoteResult(userId: string, choiceTitle: string, winningOption: string) {
    return this.dispatchNotification(userId, {
      type: 'VOTE_RESULT',
      title: 'Community Vote Decided! 📊',
      body: `The community chose "${winningOption}" for the dilemma "${choiceTitle}".`,
      data: { choiceTitle, winningOption },
      channels: ['IN_APP'],
    });
  }

  async notifyNewEpisode(
    userId: string,
    storyTitle: string,
    episodeTitle: string,
    episodeId: string,
  ) {
    return this.dispatchNotification(userId, {
      type: 'EPISODE_PUBLISHED',
      title: `New Episode: ${storyTitle} 🎬`,
      body: `Episode "${episodeTitle}" is now live! Shape the story next.`,
      referenceType: 'Episode',
      referenceId: episodeId,
      data: { storyTitle, episodeTitle, episodeId, deepLink: `/episodes/${episodeId}` },
      channels: ['IN_APP', 'PUSH'],
    });
  }
}
