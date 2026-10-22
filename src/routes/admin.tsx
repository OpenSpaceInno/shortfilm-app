import { createFileRoute, Outlet, Navigate, useLocation } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-state";
import { AdminSidebar } from "@/components/admin-layout";
import { AdminCreatorsProvider } from "@/lib/admin-creators-state";
import { StoryLabProvider } from "@/lib/story-lab-state";
import { InvestigationModal, CreateExperimentModal } from "@/components/story-lab-components";
import { BusinessProvider } from "@/lib/business-state";
import { BusinessReportModal } from "@/components/business-components";

/* ==========================================================================
   ADMIN LAYOUT ROUTE
   Wraps all /admin/* child routes.
   If not authenticated:
     - On /admin: renders login page.
     - On /admin/*: redirects to /admin.
   If authenticated: renders sidebar + content area.
   ========================================================================== */

export const Route = createFileRoute("/admin")({
  head: () => ({
    links: [
      { rel: "icon", href: "/favicon-admin.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-admin.ico", type: "image/x-icon", sizes: "any" },
      { rel: "apple-touch-icon", href: "/favicon-admin-64.png" },
    ],
  }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const { isAuthenticated } = useAdmin();
  const location = useLocation();

  const isLoginRoute = location.pathname === "/admin" || location.pathname === "/admin/";

  if (!isAuthenticated) {
    if (isLoginRoute) {
      return <Outlet />;
    }
    return <Navigate to="/admin" />;
  }

  return (
    <AdminCreatorsProvider>
      <StoryLabProvider>
        <BusinessProvider>
          <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <AdminSidebar />
            <div
              id="admin-main-viewport"
              className="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 flex flex-col overscroll-contain admin-scroll"
            >
              <Outlet />
            </div>
          </div>
          <InvestigationModal />
          <CreateExperimentModal />
          <BusinessReportModal />
        </BusinessProvider>
      </StoryLabProvider>
    </AdminCreatorsProvider>
  );
}
