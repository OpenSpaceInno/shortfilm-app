import { Link } from "@tanstack/react-router";
import { Compass, Home, Search, Sparkles, User, Bookmark, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/lib/theme-provider";
import { PwaInstallHeaderButton } from "@/lib/pwa-install";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Compass },
  { to: "/interactive", label: "Interactive", icon: Sparkles },
  { to: "/creators", label: "Creators", icon: Users },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-28 shadow-2xl transition-colors">
      {children}
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border/80 bg-card/90 backdrop-blur-md shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <ul className="flex items-stretch justify-between px-1 py-1.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-primary font-semibold" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors hover:text-foreground"
              >
                <Icon className="size-5" strokeWidth={2} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="px-5 pt-8 pb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0 pt-1">
        {action}
        <PwaInstallHeaderButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
