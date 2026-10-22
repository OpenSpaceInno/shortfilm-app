import { ExecutionContext, Injectable, UnauthorizedException, Optional, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Optional() private configService?: ConfigService,
    @Optional() @Inject(forwardRef(() => UsersService)) private usersService?: UsersService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.['authorization'];
    const devSub =
      req.headers?.['x-dev-user-sub'] ||
      (typeof authHeader === 'string' && authHeader.startsWith('Bearer dev_')
        ? authHeader.slice(7)
        : null);

    if (
      this.configService &&
      this.usersService &&
      this.configService.get<string>('NODE_ENV', 'development') === 'development' &&
      devSub
    ) {
      const sub = devSub.startsWith('dev_') ? `auth0|${devSub}` : String(devSub);
      return this.usersService
        .resolveFromAuth0({
          sub,
          email: `${devSub.replace(/[^a-zA-Z0-9]/g, '_')}@shortreel.dev`,
          name: 'Demo VIP User',
        } as any)
        .then((user) => {
          req.user = user;
          return true;
        })
        .catch(() => {
          return super.canActivate(context) as Promise<boolean>;
        });
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message = info?.message || 'Unauthorized access: Invalid or missing Auth0 Bearer token';
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}
