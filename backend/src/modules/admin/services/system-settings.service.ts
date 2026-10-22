import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { AuditService } from './audit.service';
import {
  UpdateSettingDto,
  BatchUpdateSettingsDto,
  SettingResponseDto,
} from '../dto/system-settings.dto';
import { SettingCategory } from '../../../database/schema/admin.schema';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { DEFAULT_SYSTEM_SETTINGS } from '../../../database/seeds/system-settings.seed';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    private readonly settingsRepo: SystemSettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getAllSettings(category?: SettingCategory): Promise<SettingResponseDto[]> {
    const list = await this.settingsRepo.findAll({ category });
    return list.map((s) => ({
      id: s.id,
      category: s.category,
      key: s.key,
      value: s.value,
      valueType: s.valueType,
      description: s.description,
      isPublic: s.isPublic,
      updatedBy: s.updatedBy,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    const list = await this.settingsRepo.findAll({ isPublicOnly: true });
    const result: Record<string, any> = {};
    for (const item of list) {
      result[item.key] = item.value;
    }
    return result;
  }

  async getSettingByKey(key: string): Promise<SettingResponseDto> {
    const setting = await this.settingsRepo.findByKey(key);
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return {
      id: setting.id,
      category: setting.category,
      key: setting.key,
      value: setting.value,
      valueType: setting.valueType,
      description: setting.description,
      isPublic: setting.isPublic,
      updatedBy: setting.updatedBy,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  async updateSetting(
    key: string,
    dto: UpdateSettingDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<SettingResponseDto> {
    const existing = await this.settingsRepo.findByKey(key);
    const previousState = existing ? { value: existing.value, isPublic: existing.isPublic } : null;

    const updated = await this.settingsRepo.upsert(
      key,
      {
        value: dto.value,
        isPublic: dto.isPublic,
        description: dto.description,
      },
      user.id,
    );

    // Audit logging of admin mutation
    await this.auditService.log({
      actor: user,
      action: 'SETTING_UPDATED',
      entityType: 'SYSTEM_SETTING',
      entityId: updated.id,
      previousState,
      newState: { value: updated.value, isPublic: updated.isPublic },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return {
      id: updated.id,
      category: updated.category,
      key: updated.key,
      value: updated.value,
      valueType: updated.valueType,
      description: updated.description,
      isPublic: updated.isPublic,
      updatedBy: updated.updatedBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async batchUpdateSettings(
    dto: BatchUpdateSettingsDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<SettingResponseDto[]> {
    const results: SettingResponseDto[] = [];

    for (const item of dto.settings) {
      const updated = await this.updateSetting(
        item.key,
        {
          value: item.value,
          isPublic: item.isPublic,
        },
        user,
        reqInfo,
      );
      results.push(updated);
    }

    return results;
  }

  async resetToDefaults(
    category?: SettingCategory,
    user?: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<SettingResponseDto[]> {
    const targets = category
      ? DEFAULT_SYSTEM_SETTINGS.filter((s) => s.category === category)
      : DEFAULT_SYSTEM_SETTINGS;

    const results: SettingResponseDto[] = [];

    for (const item of targets) {
      const updated = await this.settingsRepo.upsert(
        item.key,
        {
          value: item.value,
          category: item.category as SettingCategory,
          valueType: item.valueType as any,
          description: item.description,
          isPublic: item.isPublic,
        },
        user?.id,
      );

      results.push({
        id: updated.id,
        category: updated.category,
        key: updated.key,
        value: updated.value,
        valueType: updated.valueType,
        description: updated.description,
        isPublic: updated.isPublic,
        updatedBy: updated.updatedBy,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    }

    if (user) {
      await this.auditService.log({
        actor: user,
        action: 'SETTINGS_RESET_TO_DEFAULTS',
        entityType: 'SYSTEM_SETTING',
        previousState: null,
        newState: { category: category || 'ALL', count: targets.length },
        ipAddress: reqInfo?.ipAddress,
        userAgent: reqInfo?.userAgent,
        requestId: reqInfo?.requestId,
      });
    }

    return results;
  }
}
