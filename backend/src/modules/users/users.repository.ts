import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../database/database.service';
import {
  users,
  userProfiles,
  roles,
  userRoles,
  permissions,
  rolePermissions,
} from '../../database/schema/identity.schema';
import { generateUlid } from '../../database/utils/ulid.util';

export interface CreateUserData {
  externalSubjectId: string;
  externalAuthProvider?: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async findBySubject(externalSubjectId: string) {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.externalSubjectId, externalSubjectId))
      .limit(1);

    return results[0] || null;
  }

  async findById(id: string) {
    const results = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] || null;
  }

  async findByEmail(email: string) {
    const results = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] || null;
  }

  async findProfileByUserId(userId: string) {
    const results = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Atomically provisions a new User, creates their Profile, and assigns the default 'USER' role
   */
  async createUserWithProfile(data: CreateUserData) {
    const userId = generateUlid();
    const profileId = generateUlid();

    return await this.db.transaction(async (tx) => {
      // 1. Insert User
      await tx.insert(users).values({
        id: userId,
        externalSubjectId: data.externalSubjectId,
        externalAuthProvider: data.externalAuthProvider || 'AUTH0',
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || null,
        emailVerifiedAt: data.emailVerified ? new Date() : null,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      });

      // 2. Insert Profile
      await tx.insert(userProfiles).values({
        id: profileId,
        userId: userId,
        languagePreference: 'en',
      });

      // 3. Find default 'USER' role and assign in user_roles
      const userRole = await tx
        .select()
        .from(roles)
        .where(eq(roles.name, 'USER'))
        .limit(1);

      if (userRole && userRole[0]) {
        await tx.insert(userRoles).values({
          userId: userId,
          roleId: userRole[0].id,
          grantedAt: new Date(),
        });
      }

      const created = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return created[0];
    });
  }

  async updateLastLogin(id: string) {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateProfile(
    userId: string,
    data: {
      bio?: string;
      languagePreference?: string;
      genrePreferences?: string[];
      notificationPreferences?: Record<string, boolean>;
    },
  ) {
    await this.db
      .update(userProfiles)
      .set({
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.languagePreference !== undefined && { languagePreference: data.languagePreference }),
        ...(data.genrePreferences !== undefined && { genrePreferences: data.genrePreferences }),
        ...(data.notificationPreferences !== undefined && {
          notificationPreferences: data.notificationPreferences,
        }),
      })
      .where(eq(userProfiles.userId, userId));

    return this.findProfileByUserId(userId);
  }

  /**
   * Fetches all assigned role names and granular permissions for a user
   */
  async getUserRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    // 1. Fetch Roles
    const userRoleRows = await this.db
      .select({ roleName: roles.name, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRoleRows.map((r) => r.roleName);
    const roleIds = userRoleRows.map((r) => r.roleId);

    if (roleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    // 2. Fetch Permissions for these Roles
    const permRows = await this.db
      .select({ permName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        sql`${rolePermissions.roleId} IN (${sql.join(
          roleIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    const permissionNames = Array.from(new Set(permRows.map((p) => p.permName)));

    return {
      roles: roleNames,
      permissions: permissionNames,
    };
  }
}
