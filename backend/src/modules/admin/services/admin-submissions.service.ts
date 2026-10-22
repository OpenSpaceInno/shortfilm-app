import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreatorsService } from '../../creators/services/creators.service';
import { AuditService } from './audit.service';
import {
  AdminSubmissionQueryDto,
  AdminApproveSubmissionDto,
  AdminRejectSubmissionDto,
  AdminRequestChangesDto,
} from '../dto/admin-submissions.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@Injectable()
export class AdminSubmissionsService {
  private readonly logger = new Logger(AdminSubmissionsService.name);

  constructor(
    private readonly creatorsService: CreatorsService,
    private readonly auditService: AuditService,
  ) {}

  async listSubmissions(query: AdminSubmissionQueryDto) {
    return this.creatorsService.getAdminSubmissions({
      status: query.status,
      submissionType: query.submissionType,
      creatorId: query.creatorId,
      search: query.search,
      limit: query.limit,
      offset: ((query.page || 1) - 1) * (query.limit || 20),
    });
  }

  async getSubmissionById(id: string) {
    return this.creatorsService.getSubmissionById(id, undefined, true);
  }

  async approveSubmission(
    id: string,
    dto: AdminApproveSubmissionDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const existing = await this.getSubmissionById(id);
    const action = dto.publishImmediately ? 'PUBLISHED' : 'APPROVED';

    const result = await this.creatorsService.reviewSubmission(user.id, id, {
      action,
      reviewerNotes: dto.notes,
    });

    await this.auditService.log({
      actor: user,
      action: `SUBMISSION_${action}`,
      entityType: 'CREATOR_SUBMISSION',
      entityId: id,
      previousState: { status: existing.status },
      newState: { status: action, notes: dto.notes },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return result;
  }

  async rejectSubmission(
    id: string,
    dto: AdminRejectSubmissionDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const existing = await this.getSubmissionById(id);

    const result = await this.creatorsService.reviewSubmission(user.id, id, {
      action: 'REJECTED',
      reviewerNotes: `Reason: ${dto.reason}${dto.feedback ? ` - ${dto.feedback}` : ''}`,
    });

    await this.auditService.log({
      actor: user,
      action: 'SUBMISSION_REJECTED',
      entityType: 'CREATOR_SUBMISSION',
      entityId: id,
      previousState: { status: existing.status },
      newState: { status: 'REJECTED', reason: dto.reason, feedback: dto.feedback },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return result;
  }

  async requestChanges(
    id: string,
    dto: AdminRequestChangesDto,
    user: AuthenticatedUser,
    reqInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ) {
    const existing = await this.getSubmissionById(id);

    const result = await this.creatorsService.reviewSubmission(user.id, id, {
      action: 'CHANGES_REQUESTED',
      reviewerNotes: dto.feedback,
      checklist: dto.requiredModifications
        ? { requiredModifications: dto.requiredModifications }
        : undefined,
    });

    await this.auditService.log({
      actor: user,
      action: 'SUBMISSION_CHANGES_REQUESTED',
      entityType: 'CREATOR_SUBMISSION',
      entityId: id,
      previousState: { status: existing.status },
      newState: {
        status: 'CHANGES_REQUESTED',
        feedback: dto.feedback,
        requiredModifications: dto.requiredModifications,
      },
      ipAddress: reqInfo?.ipAddress,
      userAgent: reqInfo?.userAgent,
      requestId: reqInfo?.requestId,
    });

    return result;
  }
}
