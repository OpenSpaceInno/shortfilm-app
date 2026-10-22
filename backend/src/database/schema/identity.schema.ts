import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  json,
  primaryKey,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps, softDelete } from './common';

export const UserStatusEnum = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export type UserStatus = (typeof UserStatusEnum)[number];

export const RoleNameEnum = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'EDITOR',
  'CREATOR_MANAGER',
  'ANALYST',
  'FINANCE',
  'CREATOR',
  'USER',
] as const;
export type RoleName = (typeof RoleNameEnum)[number];

/**
 * Users table - linked to external Auth0 identity via external_subject_id
 */
export const users = mysqlTable(
  'users',
  {
    id: primaryUlidKey('id'),
    externalAuthProvider: varchar('external_auth_provider', { length: 20 })
      .default('AUTH0')
      .notNull(),
    externalSubjectId: varchar('external_subject_id', { length: 255 })
      .notNull()
      .unique('uq_users_subject'),
    email: varchar('email', { length: 255 }).notNull().unique('uq_users_email'),
    phone: varchar('phone', { length: 20 }),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    status: mysqlEnum('status', UserStatusEnum).default('ACTIVE').notNull(),
    emailVerifiedAt: datetime('email_verified_at', { mode: 'date', fsp: 3 }),
    lastLoginAt: datetime('last_login_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    idxUsersPhone: index('idx_users_phone').on(table.phone),
    idxUsersStatus: index('idx_users_status').on(table.status),
    idxUsersDeleted: index('idx_users_deleted').on(table.deletedAt),
  }),
);

/**
 * User Profiles table - extended user preferences and bio
 */
export const userProfiles = mysqlTable('user_profiles', {
  id: primaryUlidKey('id'),
  userId: foreignUlid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique('uq_profile_user'),
  bio: text('bio'),
  languagePreference: varchar('language_preference', { length: 10 }).default('en').notNull(),
  genrePreferences: json('genre_preferences').$type<string[]>(),
  notificationPreferences: json('notification_preferences').$type<Record<string, boolean>>(),
  ...timestamps,
});

/**
 * Roles table - shortreel RBAC roles
 */
export const roles = mysqlTable('roles', {
  id: primaryUlidKey('id'),
  name: mysqlEnum('name', RoleNameEnum).notNull().unique('uq_role_name'),
  description: varchar('description', { length: 255 }),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

/**
 * Permissions table - granular system permissions
 */
export const permissions = mysqlTable('permissions', {
  id: primaryUlidKey('id'),
  name: varchar('name', { length: 100 }).notNull().unique('uq_permission_name'),
  description: varchar('description', { length: 255 }),
});

/**
 * User Roles junction table
 */
export const userRoles = mysqlTable(
  'user_roles',
  {
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: foreignUlid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    grantedBy: foreignUlid('granted_by'),
    grantedAt: datetime('granted_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);

/**
 * Role Permissions junction table
 */
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    roleId: foreignUlid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: foreignUlid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
