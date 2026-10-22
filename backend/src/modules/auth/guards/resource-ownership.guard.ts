import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_OWNERSHIP_KEY, OwnershipOptions } from '../decorators/check-ownership.decorator';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { sql } from 'drizzle-orm';
import { ulidToBinary } from '../../../database/utils/ulid.util';

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<OwnershipOptions>(
      CHECK_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Platform Admins always bypass resource ownership checks
    if (
      user.roles?.includes('SUPER_ADMIN') ||
      user.roles?.includes('CONTENT_ADMIN')
    ) {
      return true;
    }

    const paramName = options.paramName || 'id';
    const resourceId = request.params[paramName] || request.body[paramName];

    if (!resourceId) {
      throw new ForbiddenException(
        `Ownership validation failed: parameter '${paramName}' not found in request`,
      );
    }

    const isOwner = await this.verifyOwnership(options.resourceType, resourceId, user.id);

    if (!isOwner) {
      throw new ForbiddenException(
        `Forbidden: You do not have ownership rights to modify this ${options.resourceType}`,
      );
    }

    return true;
  }

  private async verifyOwnership(
    resourceType: string,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    // 1. Direct User / Creator Profile Ownership
    if (resourceType === 'user' || resourceType === 'creator') {
      return resourceId === userId;
    }

    const db = this.dbService.getDb();
    const binaryUserId = ulidToBinary(userId);
    const binaryResourceId = ulidToBinary(resourceId);

    // 2. Story Ownership (stories.creator_id === user.id OR creator.user_id === user.id)
    if (resourceType === 'story') {
      try {
        const rows = await db.execute(
          sql`SELECT s.id FROM stories s
              LEFT JOIN creators c ON s.creator_id = c.id
              WHERE s.id = ${binaryResourceId} AND (s.creator_id = ${binaryUserId} OR c.user_id = ${binaryUserId})
              LIMIT 1`,
        );
        const result = (rows as any)[0];
        return Array.isArray(result) && result.length > 0;
      } catch {
        return false;
      }
    }

    // 3. Episode Ownership (episodes -> seasons -> stories -> creators)
    if (resourceType === 'episode') {
      try {
        const rows = await db.execute(
          sql`SELECT e.id FROM episodes e
              INNER JOIN seasons s ON e.season_id = s.id
              INNER JOIN stories st ON s.story_id = st.id
              LEFT JOIN creators c ON st.creator_id = c.id
              WHERE e.id = ${binaryResourceId} AND (st.creator_id = ${binaryUserId} OR c.user_id = ${binaryUserId})
              LIMIT 1`,
        );
        const result = (rows as any)[0];
        return Array.isArray(result) && result.length > 0;
      } catch {
        return false;
      }
    }

    return false;
  }
}
