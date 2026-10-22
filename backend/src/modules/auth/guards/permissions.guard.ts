import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admin or admin:all wildcard bypasses granular permission check
    if (
      user.roles?.includes('SUPER_ADMIN') ||
      user.permissions?.includes('admin:all')
    ) {
      return true;
    }

    // User must satisfy all declared permissions
    const missingPermissions = requiredPermissions.filter(
      (perm) => !user.permissions?.includes(perm),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Forbidden: Missing required permission(s): [${missingPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
