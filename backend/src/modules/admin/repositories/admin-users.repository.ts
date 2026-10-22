import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  users,
  userProfiles,
  roles,
  userRoles,
  permissions,
  rolePermissions,
  User,
} from '../../../database/schema/identity.schema';
import { creators } from '../../../database/schema/creator.schema';
import { moderationReports } from '../../../database/schema/admin.schema';
import { QueryAdminUsersDto } from '../dto/user-moderation.dto';

@Injectable()
export class AdminUsersRepository {
  private readonly logger = new Logger(AdminUsersRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async findUsersPaginated(
    query: QueryAdminUsersDto,
  ): Promise<{ items: Array<User & { roles: string[] }>; total: number }> {
    const conditions = [];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(users.email, term),
          like(users.displayName, term),
          like(users.externalSubjectId, term),
        ),
      );
    }

    if (query.status) {
      conditions.push(eq(users.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const userRows = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Populate roles for each user
    const items = await Promise.all(
      userRows.map(async (u) => {
        const userRoleRows = await this.db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, u.id));

        return {
          ...u,
          roles: userRoleRows.map((r) => r.roleName as string),
        };
      }),
    );

    // Optional post-filter by role if specified
    const filteredItems = query.role
      ? items.filter((u) => u.roles.includes(query.role as any))
      : items;

    return { items: filteredItems, total: query.role ? filteredItems.length : total };
  }

  async findUserDetail(id: string) {
    const userRows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = userRows[0];
    if (!user) return null;

    // Roles and Permissions
    const userRoleRows = await this.db
      .select({ roleName: roles.name, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, id));

    const roleNames = userRoleRows.map((r) => r.roleName);
    const roleIds = userRoleRows.map((r) => r.roleId);

    let permissionNames: string[] = [];
    if (roleIds.length > 0) {
      const permRows = await this.db
        .select({ permName: permissions.name })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          sql`${rolePermissions.roleId} IN (${sql.join(
            roleIds.map((rid) => sql`${rid}`),
            sql`, `,
          )})`,
        );
      permissionNames = Array.from(new Set(permRows.map((p) => p.permName)));
    }

    // Associated Creator profile if any
    const creatorRows = await this.db
      .select({
        id: creators.id,
        displayName: creators.displayName,
        tier: creators.tier,
        status: creators.status,
        verifiedAt: creators.verifiedAt,
      })
      .from(creators)
      .where(eq(creators.userId, id))
      .limit(1);

    const creator = creatorRows[0];
    const creatorProfile = creator
      ? {
          id: creator.id,
          stageName: creator.displayName,
          tier: creator.tier,
          status: creator.status,
          isKycVerified: Boolean(creator.verifiedAt),
        }
      : null;

    // Violation reports against this user
    const reportsCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(moderationReports)
      .where(and(eq(moderationReports.targetType, 'USER'), eq(moderationReports.targetId, id)));

    return {
      ...user,
      roles: roleNames,
      permissions: permissionNames,
      creatorProfile,
      reportsAgainstCount: Number(reportsCountResult[0]?.count || 0),
    };
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'): Promise<User | null> {
    await this.db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const userRows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return userRows[0] || null;
  }

  async setUserRoles(userId: string, roleNames: string[]): Promise<string[]> {
    return await this.db.transaction(async (tx) => {
      // 1. Delete existing user roles
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      // 2. Fetch role records
      const roleRows = await tx
        .select()
        .from(roles)
        .where(
          sql`${roles.name} IN (${sql.join(
            roleNames.map((r) => sql`${r}`),
            sql`, `,
          )})`,
        );

      // 3. Insert new user roles
      for (const r of roleRows) {
        await tx.insert(userRoles).values({
          userId,
          roleId: r.id,
          grantedAt: new Date(),
        });
      }

      return roleRows.map((r) => r.name);
    });
  }

  async countByStatus(): Promise<{
    total: number;
    active: number;
    suspended: number;
  }> {
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const activeResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, 'ACTIVE'));
    const suspendedResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, 'SUSPENDED'));

    return {
      total: Number(totalResult[0]?.count || 0),
      active: Number(activeResult[0]?.count || 0),
      suspended: Number(suspendedResult[0]?.count || 0),
    };
  }
}
