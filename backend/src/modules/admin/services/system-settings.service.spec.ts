import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let settingsRepo: jest.Mocked<SystemSettingsRepository>;
  let auditService: jest.Mocked<AuditService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockSetting = {
    id: 'set_01H123',
    category: 'CONTENT_DEFAULTS' as any,
    key: 'max_upload_size_mb',
    value: 500,
    valueType: 'NUMBER' as any,
    description: 'Max file upload size in MB',
    isPublic: true,
    updatedBy: 'user_admin',
    createdAt: new Date('2026-10-12T10:00:00Z'),
    updatedAt: new Date('2026-10-12T10:00:00Z'),
  };

  beforeEach(async () => {
    const mockRepo = {
      findAll: jest.fn(),
      findByKey: jest.fn(),
      upsert: jest.fn(),
    };

    const mockAudit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingsService,
        { provide: SystemSettingsRepository, useValue: mockRepo },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<SystemSettingsService>(SystemSettingsService);
    settingsRepo = module.get(SystemSettingsRepository);
    auditService = module.get(AuditService);
  });

  describe('getAllSettings', () => {
    it('should return all settings mapped to response DTOs', async () => {
      settingsRepo.findAll.mockResolvedValue([mockSetting]);

      const result = await service.getAllSettings();
      expect(result).toHaveLength(1);
      expect(result[0]?.key).toBe('max_upload_size_mb');
      expect(result[0]?.value).toBe(500);
      expect(settingsRepo.findAll).toHaveBeenCalledWith({ category: undefined });
    });

    it('should filter by category when provided', async () => {
      settingsRepo.findAll.mockResolvedValue([mockSetting]);

      await service.getAllSettings('CONTENT_DEFAULTS');
      expect(settingsRepo.findAll).toHaveBeenCalledWith({ category: 'CONTENT_DEFAULTS' });
    });
  });

  describe('getPublicSettings', () => {
    it('should return key-value dictionary of public settings only', async () => {
      settingsRepo.findAll.mockResolvedValue([
        mockSetting,
        {
          ...mockSetting,
          key: 'site_title',
          value: 'ShortReel Cinema',
        },
      ]);

      const result = await service.getPublicSettings();
      expect(result).toEqual({
        max_upload_size_mb: 500,
        site_title: 'ShortReel Cinema',
      });
      expect(settingsRepo.findAll).toHaveBeenCalledWith({ isPublicOnly: true });
    });
  });

  describe('getSettingByKey', () => {
    it('should return the setting if found', async () => {
      settingsRepo.findByKey.mockResolvedValue(mockSetting);

      const result = await service.getSettingByKey('max_upload_size_mb');
      expect(result.key).toBe('max_upload_size_mb');
    });

    it('should throw NotFoundException if setting not found', async () => {
      settingsRepo.findByKey.mockResolvedValue(null);

      await expect(service.getSettingByKey('non_existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSetting', () => {
    it('should update setting and call audit log', async () => {
      settingsRepo.findByKey.mockResolvedValue(mockSetting);
      settingsRepo.upsert.mockResolvedValue({
        ...mockSetting,
        value: 1000,
      });

      const result = await service.updateSetting(
        'max_upload_size_mb',
        { value: 1000 },
        mockAdminUser,
        { ipAddress: '127.0.0.1' },
      );

      expect(settingsRepo.upsert).toHaveBeenCalledWith(
        'max_upload_size_mb',
        { value: 1000, isPublic: undefined, description: undefined },
        'user_admin',
      );

      expect(auditService.log).toHaveBeenCalledWith({
        actor: mockAdminUser,
        action: 'SETTING_UPDATED',
        entityType: 'SYSTEM_SETTING',
        entityId: 'set_01H123',
        previousState: { value: 500, isPublic: true },
        newState: { value: 1000, isPublic: true },
        ipAddress: '127.0.0.1',
        userAgent: undefined,
        requestId: undefined,
      });

      expect(result.value).toBe(1000);
    });
  });

  describe('batchUpdateSettings', () => {
    it('should update multiple settings sequentially and return results', async () => {
      settingsRepo.findByKey.mockResolvedValue(mockSetting);
      settingsRepo.upsert.mockResolvedValue(mockSetting);

      const result = await service.batchUpdateSettings(
        {
          settings: [
            { key: 'max_upload_size_mb', value: 750 },
            { key: 'enable_registration', value: true },
          ],
        },
        mockAdminUser,
      );

      expect(result).toHaveLength(2);
      expect(auditService.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetToDefaults', () => {
    it('should upsert default values and record an audit log', async () => {
      settingsRepo.upsert.mockImplementation(async (key, data, userId) => ({
        id: `id_${key}`,
        key,
        value: data.value,
        category: data.category || 'GENERAL',
        valueType: data.valueType || 'STRING',
        description: data.description || '',
        isPublic: !!data.isPublic,
        updatedBy: userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const results = await service.resetToDefaults('FEATURE_FLAGS', mockAdminUser);
      expect(results.length).toBeGreaterThan(0);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SETTINGS_RESET_TO_DEFAULTS',
          entityType: 'SYSTEM_SETTING',
        }),
      );
    });
  });
});
