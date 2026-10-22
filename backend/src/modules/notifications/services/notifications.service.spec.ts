import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { NotificationSettingsRepository } from '../repositories/notification-settings.repository';
import { PUSH_PROVIDER } from '../providers/push-provider.interface';
import { EMAIL_PROVIDER } from '../providers/email-provider.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepo: jest.Mocked<NotificationsRepository>;
  let deviceTokensRepo: jest.Mocked<DeviceTokensRepository>;
  let settingsRepo: jest.Mocked<NotificationSettingsRepository>;
  let pushProvider: any;
  let emailProvider: any;

  const mockUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const mockNotifId = '01ARZ3NDEKTSV4RRFFQ69G5NF1';

  beforeEach(async () => {
    const mockNotificationsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
      createBatch: jest.fn(),
    };

    const mockDeviceTokensRepo = {
      upsertToken: jest.fn(),
      removeToken: jest.fn(),
      findTokensByUserId: jest.fn(),
      findTokensByUserIds: jest.fn(),
    };

    const mockSettingsRepo = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const mockPushProvider = {
      sendPush: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
    };

    const mockEmailProvider = {
      sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockNotificationsRepo },
        { provide: DeviceTokensRepository, useValue: mockDeviceTokensRepo },
        { provide: NotificationSettingsRepository, useValue: mockSettingsRepo },
        { provide: PUSH_PROVIDER, useValue: mockPushProvider },
        { provide: EMAIL_PROVIDER, useValue: mockEmailProvider },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepo = module.get(NotificationsRepository);
    deviceTokensRepo = module.get(DeviceTokensRepository);
    settingsRepo = module.get(NotificationSettingsRepository);
    pushProvider = module.get(PUSH_PROVIDER);
    emailProvider = module.get(EMAIL_PROVIDER);
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications and unread count', async () => {
      const mockItems = [
        {
          id: mockNotifId,
          userId: mockUserId,
          type: 'BADGE_UNLOCKED',
          title: 'New Badge Unlocked!',
          body: 'You earned First Step',
          referenceType: 'Badge',
          referenceId: 'badge_1',
          data: { xp: 50 },
          isRead: false,
          readAt: null,
          sentPush: true,
          sentEmail: false,
          createdAt: new Date(),
        },
      ];

      notificationsRepo.findByUserId.mockResolvedValue({
        items: mockItems as any,
        total: 1,
      });
      notificationsRepo.getUnreadCount.mockResolvedValue(1);

      const result = await service.getUserNotifications(mockUserId, { limit: 10, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      notificationsRepo.getUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount(mockUserId);

      expect(result.unreadCount).toBe(5);
      expect(notificationsRepo.getUnreadCount).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      notificationsRepo.findById.mockResolvedValue(null);

      await expect(service.markAsRead(mockUserId, 'missing_id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      notificationsRepo.findById.mockResolvedValue({
        id: mockNotifId,
        userId: 'other_user',
      } as any);

      await expect(service.markAsRead(mockUserId, mockNotifId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark notification as read and return success', async () => {
      notificationsRepo.findById.mockResolvedValue({
        id: mockNotifId,
        userId: mockUserId,
      } as any);
      notificationsRepo.markAsRead.mockResolvedValue(true);

      const result = await service.markAsRead(mockUserId, mockNotifId);

      expect(result.success).toBe(true);
      expect(notificationsRepo.markAsRead).toHaveBeenCalledWith(mockNotifId, mockUserId);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      notificationsRepo.markAllAsRead.mockResolvedValue(3);

      const result = await service.markAllAsRead(mockUserId);

      expect(result.markedCount).toBe(3);
      expect(notificationsRepo.markAllAsRead).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification if user matches', async () => {
      notificationsRepo.findById.mockResolvedValue({
        id: mockNotifId,
        userId: mockUserId,
      } as any);
      notificationsRepo.delete.mockResolvedValue(true);

      const result = await service.deleteNotification(mockUserId, mockNotifId);

      expect(result.success).toBe(true);
      expect(notificationsRepo.delete).toHaveBeenCalledWith(mockNotifId, mockUserId);
    });
  });

  describe('device tokens', () => {
    it('should register device token', async () => {
      deviceTokensRepo.upsertToken.mockResolvedValue({} as any);

      const result = await service.registerDeviceToken(mockUserId, {
        token: 'fcm_token_xyz',
        platform: 'ANDROID',
      });

      expect(result.success).toBe(true);
      expect(deviceTokensRepo.upsertToken).toHaveBeenCalledWith(
        mockUserId,
        'fcm_token_xyz',
        'ANDROID',
      );
    });

    it('should unregister device token', async () => {
      deviceTokensRepo.removeToken.mockResolvedValue(true);

      const result = await service.unregisterDeviceToken(mockUserId, 'fcm_token_xyz');

      expect(result.success).toBe(true);
      expect(deviceTokensRepo.removeToken).toHaveBeenCalledWith(mockUserId, 'fcm_token_xyz');
    });
  });

  describe('preferences', () => {
    it('should retrieve user notification preferences', async () => {
      settingsRepo.getSettings.mockResolvedValue({
        id: 'pref_1',
        userId: mockUserId,
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: false,
        episodesEnabled: true,
        votingEnabled: true,
        streaksEnabled: true,
        rewardsEnabled: true,
        marketingEnabled: false,
        updatedAt: new Date(),
      });

      const prefs = await service.getPreferences(mockUserId);

      expect(prefs.inAppEnabled).toBe(true);
      expect(prefs.emailEnabled).toBe(false);
    });

    it('should update user notification preferences', async () => {
      settingsRepo.updateSettings.mockResolvedValue({
        id: 'pref_1',
        userId: mockUserId,
        inAppEnabled: true,
        pushEnabled: false,
        emailEnabled: true,
        episodesEnabled: true,
        votingEnabled: true,
        streaksEnabled: true,
        rewardsEnabled: true,
        marketingEnabled: false,
        updatedAt: new Date(),
      });

      const updated = await service.updatePreferences(mockUserId, { pushEnabled: false });

      expect(updated.pushEnabled).toBe(false);
      expect(settingsRepo.updateSettings).toHaveBeenCalledWith(mockUserId, {
        pushEnabled: false,
      });
    });
  });

  describe('dispatchNotification', () => {
    const defaultSettings = {
      id: 'pref_1',
      userId: mockUserId,
      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
      episodesEnabled: true,
      votingEnabled: true,
      streaksEnabled: true,
      rewardsEnabled: true,
      marketingEnabled: false,
      updatedAt: new Date(),
    };

    it('should skip dispatch if user disabled that category preference', async () => {
      settingsRepo.getSettings.mockResolvedValue({
        ...defaultSettings,
        episodesEnabled: false,
      });

      const result = await service.dispatchNotification(mockUserId, {
        type: 'EPISODE_PUBLISHED',
        title: 'New Episode',
        body: 'Ep 2 live',
      });

      expect(result).toBeNull();
      expect(notificationsRepo.create).not.toHaveBeenCalled();
      expect(pushProvider.sendPush).not.toHaveBeenCalled();
    });

    it('should create in-app notification and send push when channels enabled', async () => {
      settingsRepo.getSettings.mockResolvedValue(defaultSettings);
      deviceTokensRepo.findTokensByUserId.mockResolvedValue(['token_1']);
      notificationsRepo.create.mockResolvedValue({
        id: mockNotifId,
        userId: mockUserId,
        type: 'BADGE_UNLOCKED',
        title: 'Badge Unlocked',
        body: 'Badge Body',
        isRead: false,
        sentPush: true,
        sentEmail: false,
        createdAt: new Date(),
      } as any);

      const result = await service.dispatchNotification(mockUserId, {
        type: 'BADGE_UNLOCKED',
        title: 'Badge Unlocked',
        body: 'Badge Body',
        channels: ['IN_APP', 'PUSH'],
      });

      expect(result).not.toBeNull();
      expect(pushProvider.sendPush).toHaveBeenCalledWith(['token_1'], expect.anything());
      expect(notificationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: 'BADGE_UNLOCKED',
          sentPush: true,
        }),
      );
    });

    it('should dispatch email when requested and recipient provided', async () => {
      settingsRepo.getSettings.mockResolvedValue(defaultSettings);
      notificationsRepo.create.mockResolvedValue({
        id: mockNotifId,
        userId: mockUserId,
        type: 'SUBSCRIPTION_RENEWED',
        title: 'Subscription Renewed',
        body: 'Receipt details',
        sentPush: false,
        sentEmail: true,
      } as any);

      await service.dispatchNotification(mockUserId, {
        type: 'SUBSCRIPTION_RENEWED',
        title: 'Subscription Renewed',
        body: 'Receipt details',
        channels: ['IN_APP', 'EMAIL'],
        emailRecipient: 'test@shortreel.com',
      });

      expect(emailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@shortreel.com',
          subject: 'Subscription Renewed',
        }),
      );
    });
  });

  describe('broadcast', () => {
    it('should execute broadcast dispatch across specified channels', async () => {
      const result = await service.broadcast({
        title: 'System Maintenance Notice',
        body: 'Scheduled at 2 AM UTC',
        channel: 'IN_APP',
      });

      expect(result.success).toBe(true);
      expect(result.channels).toEqual(['IN_APP']);
    });
  });

  describe('domain triggers', () => {
    it('notifyBadgeUnlocked should invoke dispatchNotification', async () => {
      const spy = jest.spyOn(service, 'dispatchNotification').mockResolvedValue({} as any);

      await service.notifyBadgeUnlocked(mockUserId, 'First Step', 50);

      expect(spy).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'BADGE_UNLOCKED',
        }),
      );
    });

    it('notifyStreakReminder should invoke dispatchNotification with streak data', async () => {
      const spy = jest.spyOn(service, 'dispatchNotification').mockResolvedValue({} as any);

      await service.notifyStreakReminder(mockUserId, 7);

      expect(spy).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'STREAK_REMINDER',
        }),
      );
    });
  });
});
