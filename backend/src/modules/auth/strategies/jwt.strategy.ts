import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../../users/users.service';
import { Auth0JwtPayload, AuthenticatedUser } from '../interfaces/auth0-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const domain = configService.get<string>('AUTH0_DOMAIN', 'shortreel-dev.auth0.com');
    const audience = configService.get<string>('AUTH0_AUDIENCE', 'https://api.shortreel.io');
    const issuer = configService.get<string>('AUTH0_ISSUER', `https://${domain}/`);

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audience,
      issuer: issuer,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: Auth0JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token payload is missing subject claim');
    }

    const user = await this.usersService.resolveFromAuth0(payload);

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('User account has been suspended');
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedException('User account has been deactivated');
    }

    return user;
  }
}
