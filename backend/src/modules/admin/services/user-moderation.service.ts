import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminUsersRepository } from '../repositories/admin-users.repository';
import { ModerationReportsRepository } from '../repositories/moderation-reports.repository';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { AuditService } from './audit.service';
import {
  QueryAdminUsersDto,
  AdminUserListItemDto,
  AdminUserDetailDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
  CreateModerationReportDto,
  QueryModerationReportsDto,
  ResolveModerationReportDto,
  ModerationReportResponseDto,
} from '../dto/user-moderation.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@Injectable()
export class UserModerationService {
  private readonly logger = new Logger(UserModerationService.name);

  constructor(
    private readonly usersRepo: AdminUsersRepository,
    private readonly reportsRepo: ModerationReportsRepository,
    private readonly contentRepo: AdminContentRepository,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(
    query: QueryAdminUsersDto,
  ): Promise<{ items: AdminUserListItemDto[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.usersRepo.findUsersPaginated(query);

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        status: u.status,
        roles: u.roles,
        lastLoginAt: u.lastLoginAt?.toISOString(),
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getUserDetail(id: string): Promise<AdminUserDetailDto> {
    const detail = await this.usersRepo.findUserDetail(id);
    if (!detail) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return {
      id: detail.id,
      email: detail.email,
      displayName: detail.displayName,
      avatarUrl: detail.avatarUrl,
      status: detail.status,
      roles: detail.roles,
      permissions: detail.permissions,
      creatorProfile: detail.creatorProfile,
      reportsAgainstCount: detail.reportsAgainstCount,
      lastLoginAt: detail.lastLoginAt?.toISOString(),
      createdAt: detail.createdAt.toISOString(),
    };
  }

  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<AdminUserDetailDto> {
    const existing = await this.usersRepo.findUserDetail(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Guard: Prevent self-suspension by Super Admin
    if (user.id === id && dto.status !== 'ACTIVE') {
      throw new BadRequestException('Administrators cannot suspend their own account');
    }

    const previousState = { status: existing.status };
    await this.usersRepo.updateStatus(id, dto.status);

    await this.auditService.log({
      actor: user,
      action: `USER_STATUS_${dto.status}`,
      entityType: 'USER',
      entityId: id,
      previousState,
      newState: { status: dto.status, reason: dto.reason },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return this.getUserDetail(id);
  }

  async updateUserRoles(
    id: string,
    dto: UpdateUserRolesDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<AdminUserDetailDto> {
    const existing = await this.usersRepo.findUserDetail(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (dto.roles.length === 0) {
      throw new BadRequestException('User must have at least one assigned role');
    }

    const previousState = { roles: existing.roles };
    await this.usersRepo.setUserRoles(id, dto.roles);

    await this.auditService.log({
      actor: user,
      action: 'USER_ROLES_UPDATED',
      entityType: 'USER',
      entityId: id,
      previousState,
      newState: { roles: dto.roles, reason: dto.reason },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return this.getUserDetail(id);
  }

  async createReport(
    dto: CreateModerationReportDto,
    reporterUserId?: string,
  ): Promise<ModerationReportResponseDto> {
    const report = await this.reportsRepo.create({
      reporterUserId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      details: dto.details,
    });

    this.logger.log(
      `Moderation report filed: target=${dto.targetType}:${dto.targetId} reason=${dto.reason} by=${reporterUserId || 'ANONYMOUS'}`,
    );

    return {
      id: report.id,
      reporterUserId: report.reporterUserId,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      resolutionAction: report.resolutionAction,
      resolutionNotes: report.resolutionNotes,
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt?.toISOString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  async listReports(
    query: QueryModerationReportsDto,
  ): Promise<{ items: ModerationReportResponseDto[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.reportsRepo.findMany(query);

    return {
      items: items.map((r) => ({
        id: r.id,
        reporterUserId: r.reporterUserId,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        resolutionAction: r.resolutionAction,
        resolutionNotes: r.resolutionNotes,
        resolvedBy: r.resolvedBy,
        resolvedAt: r.resolvedAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async resolveReport(
    id: string,
    dto: ResolveModerationReportDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<ModerationReportResponseDto> {
    const report = await this.reportsRepo.findById(id);
    if (!report) {
      throw new NotFoundException(`Moderation report '${id}' not found`);
    }

    const previousState = {
      status: report.status,
      resolutionAction: report.resolutionAction,
    };

    // Apply cascading actions if requested
    if (dto.resolutionAction === 'USER_SUSPENDED' && report.targetType === 'USER') {
      await this.usersRepo.updateStatus(report.targetId, 'SUSPENDED');
    } else if (dto.resolutionAction === 'CONTENT_REMOVED' && report.targetType === 'STORY') {
      await this.contentRepo.updateStatus(report.targetId, 'ARCHIVED');
    }

    const resolved = await this.reportsRepo.updateResolution(id, {
      action: dto.resolutionAction,
      notes: dto.resolutionNotes,
      resolvedBy: user.id,
    });

    await this.auditService.log({
      actor: user,
      action: 'MODERATION_REPORT_RESOLVED',
      entityType: 'MODERATION_REPORT',
      entityId: id,
      previousState,
      newState: {
        resolutionAction: dto.resolutionAction,
        resolutionNotes: dto.resolutionNotes,
        targetType: report.targetType,
        targetId: report.targetId,
      },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return {
      id: resolved!.id,
      reporterUserId: resolved!.reporterUserId,
      targetType: resolved!.targetType,
      targetId: resolved!.targetId,
      reason: resolved!.reason,
      details: resolved!.details,
      status: resolved!.status,
      resolutionAction: resolved!.resolutionAction,
      resolutionNotes: resolved!.resolutionNotes,
      resolvedBy: resolved!.resolvedBy,
      resolvedAt: resolved!.resolvedAt?.toISOString(),
      createdAt: resolved!.createdAt.toISOString(),
      updatedAt: resolved!.updatedAt.toISOString(),
    };
  }
}
