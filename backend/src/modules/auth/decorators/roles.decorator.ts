import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../../database/schema/identity.schema';

export const ROLES_KEY = 'roles';

/**
 * Declares the roles authorized to access an endpoint.
 * Example: @Roles('SUPER_ADMIN', 'CONTENT_ADMIN')
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
