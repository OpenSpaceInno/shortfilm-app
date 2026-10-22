import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BusinessProvider } from "@/lib/business-state";
import { BusinessReportModal } from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — PARENT LAYOUT
   Route: /admin/business
   ========================================================================== */

export const Route = createFileRoute("/admin/business")({
  component: BusinessLayout,
});

function BusinessLayout() {
  return (
    <BusinessProvider>
      <div className="flex flex-col min-h-full">
        <div className="flex-1">
          <Outlet />
        </div>
        <div className="py-4 px-8 border-t border-border/40 text-center text-[11px] text-muted-foreground bg-muted/20">
          <span>ShortReel Business Intelligence • Mock telemetry data for product demonstration • Directional metrics only</span>
        </div>
      </div>
      <BusinessReportModal />
    </BusinessProvider>
  );
}
