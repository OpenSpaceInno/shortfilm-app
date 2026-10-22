import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { StoryStateProvider } from "../lib/story-state";
import { EngagementBridge } from "../lib/engagement-state";
import { CreatorProvider } from "../lib/creator-state";
import { AdminProvider } from "../lib/admin-state";
import { ThemeProvider } from "../lib/theme-provider";
import { PwaInstallProvider } from "../lib/pwa-install";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#09090b" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ShortReel" },
      { title: "ShortReel — Vertical Short-Series OTT" },
      { name: "description", content: "Vertical short-series streaming: binge dramas, thrillers and romance in portrait." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "ShortReel — Vertical Short-Series OTT" },
      { property: "og:description", content: "Binge vertical short-series in under two minutes an episode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { rel: "apple-touch-icon", href: "/favicon-app-64.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  // Dynamically switch favicon between App and Admin console
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAdmin = pathname.startsWith("/admin");
    const svgIcon = isAdmin ? "/favicon-admin.svg" : "/favicon.svg";
    const icoIcon = isAdmin ? "/favicon-admin.ico" : "/favicon.ico";
    const appleIcon = isAdmin ? "/favicon-admin-64.png" : "/favicon-app-64.png";

    // Update SVG favicon link
    let svgLink = document.querySelector<HTMLLinkElement>("link[type='image/svg+xml']");
    if (!svgLink) {
      svgLink = document.createElement("link");
      svgLink.rel = "icon";
      svgLink.type = "image/svg+xml";
      document.head.appendChild(svgLink);
    }
    svgLink.href = svgIcon;

    // Update ICO favicon link
    let icoLink = document.querySelector<HTMLLinkElement>("link[type='image/x-icon']");
    if (!icoLink) {
      icoLink = document.createElement("link");
      icoLink.rel = "icon";
      icoLink.type = "image/x-icon";
      document.head.appendChild(icoLink);
    }
    icoLink.href = icoIcon;

    // Update Apple Touch Icon
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (appleLink) {
      appleLink.href = appleIcon;
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PwaInstallProvider>
          <AuthProvider>
            <StoryStateProvider>
              <EngagementBridge>
                <CreatorProvider>
                  <AdminProvider>
                    <Toaster richColors position="top-center" />
                    {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                    <Outlet />
                  </AdminProvider>
                </CreatorProvider>
              </EngagementBridge>
            </StoryStateProvider>
          </AuthProvider>
        </PwaInstallProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
