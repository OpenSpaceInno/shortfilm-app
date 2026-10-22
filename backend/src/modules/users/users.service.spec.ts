import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { Auth0JwtPayload } from '../auth/interfaces/auth0-payload.interface';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockUser = {
    id: '01HVG7J0000000000000000001',
    externalSubjectId: 'auth0|6507abc',
    externalAuthProvider: 'AUTH0',
    email: 'test@shortreel.io',
    phone: null,
    displayName: 'Test User',
    avatarUrl: 'https://images.shortreel.io/avatar.jpg',
    status: 'ACTIVE' as const,
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockProfile = {
    id: '01HVG7J0000000000000000002',
    userId: '01HVG7J0000000000000000001',
    bio: 'Test bio',
    languagePreference: 'en',
    genrePreferences: ['thriller'],
    notificationPreferences: { newEpisodes: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findBySubject: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findProfileByUserId: jest.fn(),
      createUserWithProfile: jest.fn(),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn(),
      getUserRolesAndPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveFromAuth0 (JIT Provisioning & Resolution)', () => {
    it('should return existing user and update last login', async () => {
      repository.findBySubject.mockResolvedValue(mockUser);
      repository.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['USER'],
        permissions: ['story:read', 'choice:submit'],
      });

      const payload: Auth0JwtPayload = {
        iss: 'https://shortreel-dev.auth0.com/',
        sub: 'auth0|6507abc',
        aud: 'https://api.shortreel.io',
        iat: 123456,
        exp: 234567,
      };

      const result = await service.resolveFromAuth0(payload);

      expect(repository.findBySubject).toHaveBeenCalledWith('auth0|6507abc');
      expect(repository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result.id).toBe(mockUser.id);
      expect(result.roles).toEqual(['USER']);
      expect(result.permissions).toContain('choice:submit');
    });

    it('should JIT-provision a new user when sub does not exist', async () => {
      repository.findBySubject.mockResolvedValue(null as any);
      repository.createUserWithProfile.mockResolvedValue(mockUser);
      repository.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['USER'],
        permissions: ['story:read'],
      });

      const payload: Auth0JwtPayload = {
        iss: 'https://shortreel-dev.auth0.com/',
        sub: 'google-oauth2|998877',
        aud: 'https://api.shortreel.io',
        iat: 123456,
        exp: 234567,
        email: 'newuser@gmail.com',
        name: 'New Google User',
        picture: 'https://avatar.google.com/pic.jpg',
        email_verified: true,
      };

      const result = await service.resolveFromAuth0(payload);

      expect(repository.createUserWithProfile).toHaveBeenCalledWith({
        externalSubjectId: 'google-oauth2|998877',
        externalAuthProvider: 'GOOGLE_OAUTH2',
        email: 'newuser@gmail.com',
        displayName: 'New Google User',
        avatarUrl: 'https://avatar.google.com/pic.jpg',
        emailVerified: true,
      });

      expect(result.id).toBe(mockUser.id);
      expect(result.displayName).toBe(mockUser.displayName);
    });

    it('should throw an error if sub claim is missing', async () => {
      await expect(
        service.resolveFromAuth0({
          iss: 'https://shortreel-dev.auth0.com/',
          sub: '',
          aud: 'https://api.shortreel.io',
          iat: 123,
          exp: 456,
        }),
      ).rejects.toThrow('Auth0 token payload missing subject (sub) claim');
    });
  });

  describe('getMe', () => {
    it('should return user details with profile and roles', async () => {
      repository.findById.mockResolvedValue(mockUser);
      repository.findProfileByUserId.mockResolvedValue(mockProfile);
      repository.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['USER', 'CREATOR'],
        permissions: ['story:create'],
      });

      const result = await service.getMe(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.roles).toEqual(['USER', 'CREATOR']);
      expect(result.profile?.bio).toBe('Test bio');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findById.mockResolvedValue(null as any);
      await expect(service.getMe('nonexistent_id')).rejects.toThrow('User not found');
    });
  });
});
