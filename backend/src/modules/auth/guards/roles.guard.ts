import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../../../database/schema/identity.schema';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no specific roles are required, allow all authenticated requests
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Platform Super Admin bypasses all role constraints
    if (user.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    // Check if user has at least one of the required roles
    const hasRole = user.roles?.some((role) =>
      requiredRoles.includes(role as RoleName),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Forbidden: Access requires one of the following roles: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
