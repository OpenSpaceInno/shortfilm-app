import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type AdminRole } from "./admin-data";
import { useAuth, type UserRole } from "./auth-context";

/* ==========================================================================
   ADMIN STATE — Authentication, Role Switching, Session (P10.1)
   Synchronized with Auth0 / JWT-backed AuthContext for SUPER_ADMIN & CONTENT_ADMIN
   ========================================================================== */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string | undefined;
}

export interface AdminContextType {
  isAuthenticated: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string, explicitRole?: AdminRole) => boolean;
  logout: () => void;
  switchRole: (role: AdminRole) => void;
  hasAccess: (section: string) => boolean;
  hasRole: (requiredRoles: AdminRole | AdminRole[]) => boolean;
}

const roleAccessMap: Record<AdminRole, string[]> = {
  "Super Admin": ["*"],
  "Content Admin": [
    "dashboard", "series", "seasons", "episodes", "videos", "characters",
    "genres", "languages", "story-lab", "business", "curation", "submissions",
    "interactive", "builder", "notifications", "creators"
  ],
  Editor: [
    "dashboard", "series", "seasons", "episodes", "characters", "interactive",
    "builder", "votes", "story-lab", "submissions"
  ],
  "Creator Manager": [
    "dashboard", "creators", "applications", "story-lab", "business", "creator-economics",
    "submissions", "notifications"
  ],
  Analyst: [
    "dashboard", "analytics", "story-lab", "business", "reports", "votes", "predictions"
  ],
  Finance: [
    "dashboard", "subscriptions", "analytics", "business", "revenue", "entitlements", "content-economics"
  ],
};

const userRoleToAdminRole = (userRole?: UserRole): AdminRole => {
  switch (userRole) {
    case "SUPER_ADMIN": return "Super Admin";
    case "CONTENT_ADMIN": return "Content Admin";
    case "EDITOR": return "Editor";
    case "ANALYST": return "Analyst";
    case "FINANCE": return "Finance";
    case "CREATOR": return "Creator Manager";
    default: return "Super Admin";
  }
};

const adminRoleToUserRole = (adminRole: AdminRole): UserRole => {
  switch (adminRole) {
    case "Super Admin": return "SUPER_ADMIN";
    case "Content Admin": return "CONTENT_ADMIN";
    case "Editor": return "EDITOR";
    case "Analyst": return "ANALYST";
    case "Finance": return "FINANCE";
    case "Creator Manager": return "CREATOR";
    default: return "SUPER_ADMIN";
  }
};

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user: authUser, switchRole: authSwitchRole, logout: authLogout } = useAuth();
  const [localAuth, setLocalAuth] = useState(false);
  const [activeAdminRole, setActiveAdminRole] = useState<AdminRole>("Super Admin");

  // Sync with Auth0 / AuthContext user when an admin role is present
  useEffect(() => {
    if (authUser && authUser.roles && authUser.roles.length > 0) {
      const topRole = authUser.roles[0];
      const isAdmin = authUser.roles.some((r) =>
        ["SUPER_ADMIN", "CONTENT_ADMIN", "EDITOR", "ANALYST", "FINANCE"].includes(r)
      );
      if (isAdmin) {
        setLocalAuth(true);
        setActiveAdminRole(userRoleToAdminRole(topRole));
      }
    }
  }, [authUser]);

  const isAuthenticated = localAuth || (!!authUser && authUser.roles.some((r) =>
    ["SUPER_ADMIN", "CONTENT_ADMIN", "EDITOR", "ANALYST", "FINANCE"].includes(r)
  ));

  const currentUser: AdminUser | null = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      id: authUser?.id || "admin-001",
      name: authUser?.displayName || authUser?.name || "Platform Admin",
      email: authUser?.email || "admin@shortreel.in",
      role: activeAdminRole,
      avatar: authUser?.avatarUrl,
    };
  }, [isAuthenticated, authUser, activeAdminRole]);

  const login = useCallback(
    (email: string, _password: string, explicitRole?: AdminRole) => {
      if (email.trim()) {
        setLocalAuth(true);
        let mappedRole: AdminRole = "Super Admin";
        if (explicitRole) {
          mappedRole = explicitRole;
        } else {
          const lower = email.toLowerCase();
          if (lower.includes("finance")) mappedRole = "Finance";
          else if (lower.includes("analyst")) mappedRole = "Analyst";
          else if (lower.includes("creator") || lower.includes("manager")) mappedRole = "Creator Manager";
          else if (lower.includes("content")) mappedRole = "Content Admin";
          else if (lower.includes("editor")) mappedRole = "Editor";
          else mappedRole = "Super Admin";
        }
        setActiveAdminRole(mappedRole);
        authSwitchRole(adminRoleToUserRole(mappedRole));
        return true;
      }
      return false;
    },
    [authSwitchRole],
  );

  const logout = useCallback(() => {
    setLocalAuth(false);
    authLogout();
  }, [authLogout]);

  const switchRole = useCallback(
    (role: AdminRole) => {
      setActiveAdminRole(role);
      authSwitchRole(adminRoleToUserRole(role));
    },
    [authSwitchRole],
  );

  const hasAccess = useCallback(
    (section: string) => {
      if (!currentUser) return false;
      const allowed = roleAccessMap[currentUser.role] || [];
      return allowed.includes("*") || allowed.includes(section.toLowerCase());
    },
    [currentUser],
  );

  const hasRole = useCallback(
    (requiredRoles: AdminRole | AdminRole[]) => {
      if (!currentUser) return false;
      if (currentUser.role === "Super Admin") return true;
      const list = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return list.includes(currentUser.role);
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      currentUser,
      login,
      logout,
      switchRole,
      hasAccess,
      hasRole,
    }),
    [isAuthenticated, currentUser, login, logout, switchRole, hasAccess, hasRole],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

