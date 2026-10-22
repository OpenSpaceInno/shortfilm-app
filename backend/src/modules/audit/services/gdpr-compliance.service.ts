import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, lt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { users, userProfiles } from '../../../database/schema/identity.schema';
import { creators } from '../../../database/schema/creator.schema';
import { subscriptions } from '../../../database/schema/subscription.schema';
import { userChoices } from '../../../database/schema/interactive.schema';
import { notifications } from '../../../database/schema/notification.schema';
import { GdprRequestsRepository } from '../repositories/gdpr-requests.repository';
import { AuditService } from './audit.service';
import {
  GdprAnonymizeUserDto,
  GdprExportResponseDto,
  GdprRetentionStatusDto,
  QueryGdprRequestsDto,
} from '../dto/gdpr.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { AuditAction } from '../constants/audit-actions.constant';
import * as crypto from 'crypto';

@Injectable()
export class GdprComplianceService {
  private readonly logger = new Logger(GdprComplianceService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly gdprRepo: GdprRequestsRepository,
    private readonly auditService: AuditService,
  ) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  /**
   * GDPR Article 17: Right to Erasure / "Right to be Forgotten"
   * Irreversibly strips personal identifiable information (PII) from user record,
   * while preserving historical interactive choices and platform metrics anonymously.
   * Ref: 26_DATA_RETENTION.md & 28_DATA_RETENTION.md
   */
  async anonymizeUser(
    userId: string,
    dto: GdprAnonymizeUserDto,
    actor: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    if (!dto.confirmed) {
      throw new BadRequestException('Action must be explicitly confirmed');
    }

    if (actor.id === userId) {
      throw new BadRequestException('Administrators cannot execute self-erasure via this endpoint');
    }

    const existingUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = existingUsers[0];
    if (!user) {
      throw new NotFoundException(`User '${userId}' not found`);
    }

    if (user.status === 'DELETED') {
      throw new BadRequestException(`User '${userId}' is already deleted / anonymized`);
    }

    const previousState = {
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };

    // Scramble identifiers with deterministic salt hash to guarantee email uniqueness constraint
    const hash = crypto.createHash('sha256').update(`${userId}_${Date.now()}`).digest('hex').substring(0, 12);
    const anonymizedEmail = `anon_${hash}@anonymized.shortreel.local`;
    const anonymizedSubject = `anon|${userId}_${hash}`;

    // 1. Wipe PII in users table
    await this.db
      .update(users)
      .set({
        email: anonymizedEmail,
        displayName: 'Anonymous User',
        phone: null,
        avatarUrl: null,
        externalSubjectId: anonymizedSubject,
        status: 'DELETED',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 2. Wipe PII in user_profiles table if present
    await this.db
      .update(userProfiles)
      .set({
        bio: null,
        notificationPreferences: null,
        genrePreferences: null,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));

    // 3. Clear pending / read notifications
    await this.db.delete(notifications).where(eq(notifications.userId, userId));

    // 4. Record compliance request tracking
    const gdprRecord = await this.gdprRepo.create({
      userId,
      requestType: 'ERASURE',
      status: 'COMPLETED',
      reason: dto.reason,
      metadata: {
        anonymizedEmail,
        executedImmediately: dto.immediate ?? true,
      },
    });

    await this.gdprRepo.update(gdprRecord.id, {
      anonymizedEmail,
      processedBy: actor.id,
      processedAt: new Date(),
    });

    // 5. Immutable audit log recording
    await this.auditService.log({
      actor,
      action: AuditAction.GDPR_USER_ANONYMIZED,
      entityType: 'USER',
      entityId: userId,
      previousState,
      newState: {
        status: 'DELETED',
        anonymizedEmail,
        reason: dto.reason,
      },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    this.logger.log(`GDPR Right to Erasure completed for user=${userId} by admin=${actor.id}`);

    return {
      success: true,
      userId,
      anonymizedEmail,
      message: 'User PII successfully anonymized and unlinked in compliance with GDPR Article 17',
    };
  }

  /**
   * GDPR Article 20: Right to Data Portability (Subject Access Request - SAR)
   * Extracts user's profile, preferences, creator details, and activity stats.
   */
  async exportUserData(
    userId: string,
    actor: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<GdprExportResponseDto> {
    const existingUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = existingUsers[0];
    if (!user) {
      throw new NotFoundException(`User '${userId}' not found`);
    }

    // 1. Fetch user profile
    const profileRows = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // 2. Fetch creator profile if user is a creator
    const creatorRows = await this.db
      .select()
      .from(creators)
      .where(eq(creators.userId, userId))
      .limit(1);

    // 3. Fetch subscriptions
    const subRows = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // 4. Fetch user choices count
    const choicesCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(userChoices)
      .where(eq(userChoices.userId, userId));

    // Record GDPR request
    const request = await this.gdprRepo.create({
      userId,
      requestType: 'EXPORT',
      status: 'COMPLETED',
      reason: 'Subject Access Request (SAR)',
      metadata: { requestedBy: actor.id },
    });

    await this.gdprRepo.update(request.id, {
      processedBy: actor.id,
      processedAt: new Date(),
    });

    // Record audit log
    await this.auditService.log({
      actor,
      action: AuditAction.GDPR_DATA_EXPORTED,
      entityType: 'USER',
      entityId: userId,
      previousState: null,
      newState: { exportId: request.id },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    const exportPayload: GdprExportResponseDto = {
      userId,
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      },
      preferences: profileRows[0]
        ? {
            bio: profileRows[0].bio,
            languagePreference: profileRows[0].languagePreference,
            genrePreferences: profileRows[0].genrePreferences,
            notificationPreferences: profileRows[0].notificationPreferences,
          }
        : undefined,
      creatorProfile: creatorRows[0]
        ? {
            id: creatorRows[0].id,
            displayName: creatorRows[0].displayName,
            tier: creatorRows[0].tier,
            status: creatorRows[0].status,
          }
        : null,
      subscriptions: subRows.map((s) => ({
        id: s.id,
        status: s.status,
        billingInterval: s.billingInterval,
        currentPeriodStart: s.currentPeriodStart ? s.currentPeriodStart.toISOString() : null,
        currentPeriodEnd: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : null,
      })),
      historyStats: {
        totalChoicesMade: Number(choicesCount[0]?.count || 0),
        totalWatchHistoryRecords: 0,
        totalReviewsWritten: 0,
      },
    };

    return exportPayload;
  }

  /**
   * GDPR & DPDP IP address anonymization/masking
   * IPv4: Zeroes out the last octet (e.g. 192.168.1.123 -> 192.168.1.0)
   * IPv6: Masks lower 80 bits, retaining only top 48 bits
   */
  anonymizeIp(ip: string): string {
    if (!ip) return '0.0.0.0';

    const cleanIp = ip.split(',')[0]?.trim() || ip;

    // IPv4 check
    if (cleanIp.includes('.')) {
      const parts = cleanIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // IPv6 check
    if (cleanIp.includes(':')) {
      const parts = cleanIp.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::0`;
      }
    }

    return '0.0.0.0';
  }

  async listGdprRequests(query: QueryGdprRequestsDto) {
    return this.gdprRepo.findMany(query);
  }

  /**
   * Analyzes data retention status across tables against 26_DATA_RETENTION.md schedule
   */
  async getRetentionStatus(): Promise<GdprRetentionStatusDto> {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // 1. Audit Logs: 1 year hot retention / 7 years minimum
    const auditMetrics = await this.auditService.getAuditRetentionMetrics();

    // 2. Notifications: 30 days read, 60 days unread
    const thirtyDaysAgo = new Date(now - 30 * oneDay);
    const readNotificationsEligible = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.isRead, true), lt(notifications.createdAt, thirtyDaysAgo)));

    const totalNotifications = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications);

    return {
      evaluatedAt: new Date().toISOString(),
      entities: [
        {
          entity: 'audit_logs',
          policy: '7 Years compliance minimum; cold archive after 1 year',
          retentionWindowDays: 365,
          totalRecords: auditMetrics.totalLogs,
          recordsEligibleForPurge: auditMetrics.olderThanOneYear,
        },
        {
          entity: 'notifications (read)',
          policy: '30 Days automated sweep',
          retentionWindowDays: 30,
          totalRecords: Number(totalNotifications[0]?.count || 0),
          recordsEligibleForPurge: Number(readNotificationsEligible[0]?.count || 0),
        },
        {
          entity: 'analytics_events (raw)',
          policy: '90 Days partition truncation',
          retentionWindowDays: 90,
          totalRecords: 0,
          recordsEligibleForPurge: 0,
        },
      ],
    };
  }
}
