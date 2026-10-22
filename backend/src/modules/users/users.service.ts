import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Auth0JwtPayload, AuthenticatedUser } from '../auth/interfaces/auth0-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Resolves or JIT-provisions a ShortReel user from an Auth0 JWT payload (ADR-003 Option C)
   */
  async resolveFromAuth0(payload: Auth0JwtPayload): Promise<AuthenticatedUser> {
    const sub = payload.sub;
    if (!sub) {
      throw new Error('Auth0 token payload missing subject (sub) claim');
    }

    let user = await this.usersRepository.findBySubject(sub);

    if (!user) {
      this.logger.log(`[JIT Provisioning] New user detected with Auth0 sub: ${sub}`);

      // Extract provider name from sub (e.g. "auth0|123" -> "AUTH0", "google-oauth2|123" -> "GOOGLE")
      const providerPrefix = sub.split('|')[0] || 'AUTH0';
      const provider = providerPrefix.toUpperCase().replace('-', '_');

      const email = payload.email || `${sub.replace('|', '_')}@shortreel.user`;
      const displayName =
        payload.name || payload.nickname || email.split('@')[0] || 'ShortReel User';
      const avatarUrl = payload.picture || null;
      const emailVerified = !!payload.email_verified;

      user = await this.usersRepository.createUserWithProfile({
        externalSubjectId: sub,
        externalAuthProvider: provider,
        email,
        displayName,
        avatarUrl,
        emailVerified,
      });

      this.logger.log(`[JIT Provisioning] Created ShortReel user ID: ${user.id} for email: ${user.email}`);
    } else {
      // Background non-blocking update of last login timestamp
      this.usersRepository.updateLastLogin(user.id).catch((err) => {
        this.logger.warn(`Failed to update last login for user ${user.id}: ${err.message}`);
      });
    }

    // Retrieve active roles and permissions from ShortReel MySQL
    const { roles, permissions } = await this.usersRepository.getUserRolesAndPermissions(user.id);

    return {
      id: user.id,
      externalSubjectId: user.externalSubjectId,
      externalAuthProvider: user.externalAuthProvider,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status as 'ACTIVE' | 'SUSPENDED' | 'DELETED',
      roles,
      permissions,
    };
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.usersRepository.findProfileByUserId(userId);
    const { roles } = await this.usersRepository.getUserRolesAndPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles,
      profile: profile
        ? {
            bio: profile.bio,
            languagePreference: profile.languagePreference,
            genrePreferences: profile.genrePreferences,
            notificationPreferences: profile.notificationPreferences,
          }
        : undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.updateProfile(userId, {
      bio: dto.bio,
      languagePreference: dto.languagePreference,
      genrePreferences: dto.genrePreferences,
      notificationPreferences: dto.notificationPreferences,
    });

    return this.getMe(userId);
  }
}
