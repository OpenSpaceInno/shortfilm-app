import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '../services/notifications.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import {
  RegisterDeviceTokenDto,
  UpdateNotificationPreferencesDto,
  BroadcastNotificationDto,
} from '../dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockUser: AuthenticatedUser = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    externalSubjectId: 'auth0|123456',
    externalAuthProvider: 'AUTH0',
    email: 'test@shortreel.com',
    displayName: 'Test User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['USER'],
    permissions: [],
  };

  const mockNotifId = '01ARZ3NDEKTSV4RRFFQ69G5NF1';

  beforeEach(async () => {
    const mockNotificationsService = {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      registerDeviceToken: jest.fn(),
      unregisterDeviceToken: jest.fn(),
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
      broadcast: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  describe('getNotifications', () => {
    it('should return wrapped paginated notifications', async () => {
      const mockResult = {
        items: [],
        total: 0,
        unreadCount: 0,
        hasMore: false,
      };

      service.getUserNotifications.mockResolvedValue(mockResult);

      const response = await controller.getNotifications(mockUser, { limit: 10, offset: 0 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getUserNotifications).toHaveBeenCalledWith(mockUser.id, {
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return wrapped unread count for user', async () => {
      service.getUnreadCount.mockResolvedValue({ unreadCount: 3 });

      const response = await controller.getUnreadCount(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ unreadCount: 3 });
      expect(service.getUnreadCount).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      service.markAsRead.mockResolvedValue({ success: true });

      const response = await controller.markAsRead(mockUser, mockNotifId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ success: true });
      expect(service.markAsRead).toHaveBeenCalledWith(mockUser.id, mockNotifId);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      service.markAllAsRead.mockResolvedValue({ markedCount: 5 });

      const response = await controller.markAllAsRead(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ markedCount: 5 });
      expect(service.markAllAsRead).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      service.deleteNotification.mockResolvedValue({ success: true });

      const response = await controller.deleteNotification(mockUser, mockNotifId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ success: true });
      expect(service.deleteNotification).toHaveBeenCalledWith(mockUser.id, mockNotifId);
    });
  });

  describe('registerDeviceToken', () => {
    it('should register push token', async () => {
      const dto: RegisterDeviceTokenDto = {
        token: 'device_token_abc',
        platform: 'WEB',
      };
      service.registerDeviceToken.mockResolvedValue({ success: true });

      const response = await controller.registerDeviceToken(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ success: true });
      expect(service.registerDeviceToken).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister push token', async () => {
      service.unregisterDeviceToken.mockResolvedValue({ success: true });

      const response = await controller.unregisterDeviceToken(mockUser, 'device_token_abc');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ success: true });
      expect(service.unregisterDeviceToken).toHaveBeenCalledWith(
        mockUser.id,
        'device_token_abc',
      );
    });
  });

  describe('preferences', () => {
    it('should get notification delivery preferences', async () => {
      const mockPrefs = {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: false,
        episodesEnabled: true,
        votingEnabled: true,
        streaksEnabled: true,
        rewardsEnabled: true,
        marketingEnabled: false,
      };

      service.getPreferences.mockResolvedValue(mockPrefs);

      const response = await controller.getPreferences(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPrefs);
      expect(service.getPreferences).toHaveBeenCalledWith(mockUser.id);
    });

    it('should update notification preferences', async () => {
      const dto: UpdateNotificationPreferencesDto = {
        emailEnabled: true,
      };
      const mockUpdated = {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        episodesEnabled: true,
        votingEnabled: true,
        streaksEnabled: true,
        rewardsEnabled: true,
        marketingEnabled: false,
      };

      service.updatePreferences.mockResolvedValue(mockUpdated);

      const response = await controller.updatePreferences(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockUpdated);
      expect(service.updatePreferences).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('broadcast', () => {
    it('should allow admin to broadcast notification', async () => {
      const dto: BroadcastNotificationDto = {
        title: 'Platform Maintenance',
        body: 'Down for 15 minutes',
        channel: 'IN_APP',
      };
      const mockResult = {
        success: true,
        targetCount: 100,
        channels: ['IN_APP'],
      };

      service.broadcast.mockResolvedValue(mockResult);

      const response = await controller.broadcast(dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.broadcast).toHaveBeenCalledWith(dto);
    });
  });
});
