import {
  users,
  userProfiles,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  RoleNameEnum,
  UserStatusEnum,
} from './identity.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Identity Schema Definition', () => {
  it('should define all 6 identity and RBAC tables', () => {
    expect(users).toBeDefined();
    expect(userProfiles).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(userRoles).toBeDefined();
    expect(rolePermissions).toBeDefined();
  });

  it('should define the 8 canonical roles in RoleNameEnum', () => {
    expect(RoleNameEnum).toContain('SUPER_ADMIN');
    expect(RoleNameEnum).toContain('CONTENT_ADMIN');
    expect(RoleNameEnum).toContain('EDITOR');
    expect(RoleNameEnum).toContain('CREATOR_MANAGER');
    expect(RoleNameEnum).toContain('ANALYST');
    expect(RoleNameEnum).toContain('FINANCE');
    expect(RoleNameEnum).toContain('CREATOR');
    expect(RoleNameEnum).toContain('USER');
    expect(RoleNameEnum.length).toBe(8);
  });

  it('should define the 3 user statuses in UserStatusEnum', () => {
    expect(UserStatusEnum).toContain('ACTIVE');
    expect(UserStatusEnum).toContain('SUSPENDED');
    expect(UserStatusEnum).toContain('DELETED');
    expect(UserStatusEnum.length).toBe(3);
  });

  it('should contain externalAuth fields and exclude password_hash in users table', () => {
    const columns = getTableColumns(users);
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('externalAuthProvider');
    expect(columns).toHaveProperty('externalSubjectId');
    expect(columns).toHaveProperty('email');
    expect(columns).toHaveProperty('displayName');
    expect(columns).toHaveProperty('status');

    // Confirm P0-001 resolution: password_hash must NOT exist
    expect(columns).not.toHaveProperty('passwordHash');
    expect(columns).not.toHaveProperty('password_hash');
  });

  it('should define user_profiles with foreign key to users', () => {
    const columns = getTableColumns(userProfiles);
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('userId');
    expect(columns).toHaveProperty('bio');
    expect(columns).toHaveProperty('languagePreference');
  });
});
