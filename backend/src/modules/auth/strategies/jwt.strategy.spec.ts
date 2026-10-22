import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockActiveUser: AuthenticatedUser = {
    id: '01HVG7J0000000000000000001',
    externalSubjectId: 'auth0|6507abc',
    externalAuthProvider: 'AUTH0',
    email: 'user@shortreel.io',
    displayName: 'Active User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['USER'],
    permissions: ['story:read'],
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: string) => {
        if (key === 'AUTH0_DOMAIN') return 'shortreel-dev.auth0.com';
        if (key === 'AUTH0_AUDIENCE') return 'https://api.shortreel.io';
        if (key === 'AUTH0_ISSUER') return 'https://shortreel-dev.auth0.com/';
        return defaultVal;
      }),
    };

    const mockUsersService = {
      resolveFromAuth0: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return an active authenticated user', async () => {
    usersService.resolveFromAuth0.mockResolvedValue(mockActiveUser);

    const payload = {
      iss: 'https://shortreel-dev.auth0.com/',
      sub: 'auth0|6507abc',
      aud: 'https://api.shortreel.io',
      iat: 123456,
      exp: 234567,
    };

    const result = await strategy.validate(payload);
    expect(result).toEqual(mockActiveUser);
    expect(usersService.resolveFromAuth0).toHaveBeenCalledWith(payload);
  });

  it('should throw UnauthorizedException when sub is missing', async () => {
    await expect(
      strategy.validate({
        iss: 'https://shortreel-dev.auth0.com/',
        sub: '',
        aud: 'https://api.shortreel.io',
        iat: 123,
        exp: 456,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject SUSPENDED accounts', async () => {
    usersService.resolveFromAuth0.mockResolvedValue({
      ...mockActiveUser,
      status: 'SUSPENDED',
    });

    await expect(
      strategy.validate({
        iss: 'https://shortreel-dev.auth0.com/',
        sub: 'auth0|suspended_user',
        aud: 'https://api.shortreel.io',
        iat: 123,
        exp: 456,
      }),
    ).rejects.toThrow('User account has been suspended');
  });

  it('should reject DELETED accounts', async () => {
    usersService.resolveFromAuth0.mockResolvedValue({
      ...mockActiveUser,
      status: 'DELETED',
    });

    await expect(
      strategy.validate({
        iss: 'https://shortreel-dev.auth0.com/',
        sub: 'auth0|deleted_user',
        aud: 'https://api.shortreel.io',
        iat: 123,
        exp: 456,
      }),
    ).rejects.toThrow('User account has been deactivated');
  });
});
