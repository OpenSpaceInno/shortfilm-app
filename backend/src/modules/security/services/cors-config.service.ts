import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import {
  DEFAULT_CORS_ORIGINS,
  SECURITY_ALLOWED_HEADERS,
  SECURITY_ALLOWED_METHODS,
  SECURITY_EXPOSED_HEADERS,
} from '../constants/security.constants';

@Injectable()
export class CorsConfigService {
  private readonly logger = new Logger(CorsConfigService.name);
  private readonly allowedOrigins: string[];
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const envOrigins = this.configService.get<string>('CORS_ORIGINS');

    if (envOrigins) {
      this.allowedOrigins = envOrigins
        .split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter((s) => s.length > 0);
    } else {
      this.allowedOrigins = [...DEFAULT_CORS_ORIGINS];
    }

    // Validation: Disallow wildcard '*' if credentials are true
    if (this.allowedOrigins.includes('*')) {
      if (this.isProduction) {
        this.logger.error(
          'CRITICAL SECURITY WARNING: Wildcard origin "*" with credentials is strictly prohibited in production! Removing wildcard.',
        );
        this.allowedOrigins = this.allowedOrigins.filter((o) => o !== '*');
      } else {
        this.logger.warn(
          'Security Notice: Wildcard origin "*" configured. Note that browsers reject credentials: true with wildcard origins.',
        );
      }
    }

    this.logger.log(`Initialized CORS allowed origins: ${JSON.stringify(this.allowedOrigins)}`);
  }

  /**
   * Evaluates if a given client origin is allowed by the security policy.
   * Server-to-server or same-origin requests without an Origin header are permitted.
   */
  public isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) {
      return true;
    }

    const normalized = origin.trim().replace(/\/$/, '');

    // Exact match in allowed origins
    if (this.allowedOrigins.includes(normalized)) {
      return true;
    }

    // In non-production environments, allow localhost / 127.0.0.1 ports
    if (!this.isProduction) {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (localhostRegex.test(normalized)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates production-ready CorsOptions for Express/NestJS enableCors.
   */
  public getCorsOptions(): CorsOptions {
    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (this.isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          this.logger.warn(`CORS request blocked from unauthorized origin: ${origin}`);
          callback(new Error(`CORS Error: Origin ${origin} is not allowed by ShortReel security policy`), false);
        }
      },
      credentials: true,
      methods: SECURITY_ALLOWED_METHODS,
      allowedHeaders: SECURITY_ALLOWED_HEADERS,
      exposedHeaders: SECURITY_EXPOSED_HEADERS,
      maxAge: 86400, // 24 hours preflight cache
    };
  }

  /**
   * Returns copy of active allowed origins.
   */
  public getAllowedOrigins(): string[] {
    return [...this.allowedOrigins];
  }
}
