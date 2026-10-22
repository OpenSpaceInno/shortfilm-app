export interface Auth0JwtPayload {
  iss: string;
  sub: string; // e.g. "auth0|6507..." or "google-oauth2|102..."
  aud: string | string[];
  iat: number;
  exp: number;
  azp?: string;
  scope?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface AuthenticatedUser {
  id: string; // ShortReel ULID string
  externalSubjectId: string; // Auth0 sub
  externalAuthProvider: string; // 'AUTH0', 'GOOGLE', etc.
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  roles: string[];
  permissions: string[];
}
