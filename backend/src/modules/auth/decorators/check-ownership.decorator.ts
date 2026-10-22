import { SetMetadata } from '@nestjs/common';

export interface OwnershipOptions {
  resourceType: 'story' | 'episode' | 'creator' | 'user';
  paramName?: string; // Route parameter containing the resource ID, defaults to 'id'
}

export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

/**
 * Enforces that the current authenticated user owns the resource being accessed/mutated.
 * Administrative roles (SUPER_ADMIN, CONTENT_ADMIN) automatically bypass this check.
 * Example: @CheckOwnership({ resourceType: 'story', paramName: 'id' })
 */
export const CheckOwnership = (options: OwnershipOptions) =>
  SetMetadata(CHECK_OWNERSHIP_KEY, options);
