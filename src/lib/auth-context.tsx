import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { configureApiClient } from './api-client/client';

export type UserRole =
  | 'USER'
  | 'CREATOR'
  | 'SUPER_ADMIN'
  | 'CONTENT_ADMIN'
  | 'EDITOR'
  | 'ANALYST'
  | 'FINANCE';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  name?: string | undefined;
  avatarUrl?: string | undefined;
  roles: UserRole[];
  isVip?: boolean | undefined;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  role: UserRole;
  setDevRole: (role: UserRole) => void;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  switchRole: (role: UserRole) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AUTH_USER_KEY = 'shortreel_auth_user';
const AUTH_TOKEN_KEY = 'shortreel_auth_token';

// Default mock profiles for developer and sandbox environments
export const DEV_PROFILES: Record<UserRole, AuthUser> = {
  USER: {
    id: 'usr_consumer_001',
    email: 'viewer@shortreel.io',
    displayName: 'Priya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    roles: ['USER'],
    isVip: true,
  },
  CREATOR: {
    id: 'usr_creator_001',
    email: 'creator@shortreel.io',
    displayName: 'Vikramaditya Motwane',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    roles: ['CREATOR', 'USER'],
    isVip: true,
  },
  SUPER_ADMIN: {
    id: 'usr_admin_001',
    email: 'admin@shortreel.io',
    displayName: 'Platform Super Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    roles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'USER'],
    isVip: true,
  },
  CONTENT_ADMIN: {
    id: 'usr_content_admin_001',
    email: 'editorial@shortreel.io',
    displayName: 'Chief Editorial Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    roles: ['CONTENT_ADMIN', 'USER'],
    isVip: true,
  },
  EDITOR: {
    id: 'usr_editor_001',
    email: 'editor@shortreel.io',
    displayName: 'Story Version Editor',
    roles: ['EDITOR', 'USER'],
  },
  ANALYST: {
    id: 'usr_analyst_001',
    email: 'analyst@shortreel.io',
    displayName: 'Data & Story Lab Analyst',
    roles: ['ANALYST', 'USER'],
  },
  FINANCE: {
    id: 'usr_finance_001',
    email: 'finance@shortreel.io',
    displayName: 'Revenue & Payouts Mgr',
    roles: ['FINANCE', 'USER'],
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from storage or default to consumer dev user
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);
      } else {
        // Default to initialized dev viewer
        const defaultUser = DEV_PROFILES.USER;
        const defaultToken = `dev_jwt_${defaultUser.id}_${Date.now()}`;
        setUser(defaultUser);
        setToken(defaultToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
        localStorage.setItem(AUTH_TOKEN_KEY, defaultToken);
      }
    } catch {
      setUser(DEV_PROFILES.USER);
      setToken('dev_jwt_fallback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configure global API client with active token resolver
  useEffect(() => {
    configureApiClient({
      getToken: () => token,
      onUnauthorized: () => {
        console.warn('[AuthContext] 401 Unauthorized received from API');
      },
    });
  }, [token]);

  const login = useCallback(async (email?: string, _password?: string) => {
    setIsLoading(true);
    try {
      // Find matching profile or default to Super Admin if email contains 'admin'
      let matchedProfile = DEV_PROFILES.USER;
      if (email?.includes('admin')) {
        matchedProfile = DEV_PROFILES.SUPER_ADMIN;
      } else if (email?.includes('creator')) {
        matchedProfile = DEV_PROFILES.CREATOR;
      }

      const activeUser = { ...matchedProfile, ...(email ? { email } : {}) };
      const activeToken = `dev_jwt_${activeUser.id}_${Date.now()}`;

      setUser(activeUser);
      setToken(activeToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(activeUser));
      localStorage.setItem(AUTH_TOKEN_KEY, activeToken);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }, []);

  const getAccessToken = useCallback(async () => {
    return token;
  }, [token]);

  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]) => {
      if (!user) return false;
      if (user.roles.includes('SUPER_ADMIN')) return true; // Super admin possesses all permissions

      const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return requiredList.some((r) => user.roles.includes(r));
    },
    [user],
  );

  const switchRole = useCallback((newRole: UserRole) => {
    const profile = DEV_PROFILES[newRole] || DEV_PROFILES.USER;
    const newToken = `dev_jwt_${profile.id}_${Date.now()}`;
    setUser(profile);
    setToken(newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!user && !!token,
      isLoading,
      user: user ? { ...user, name: user.displayName || user.name } : null,
      token,
      role: user?.roles[0] || 'USER',
      setDevRole: switchRole,
      login,
      logout,
      getAccessToken,
      hasRole,
      switchRole,
      updateUser,
    }),
    [user, token, isLoading, login, logout, getAccessToken, hasRole, switchRole, updateUser],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
