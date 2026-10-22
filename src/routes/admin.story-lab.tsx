import { createFileRoute, Outlet } from "@tanstack/react-router";

/* ==========================================================================
   STORY LAB — PARENT ROUTE
   /admin/story-lab
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab")({
  component: StoryLabLayout,
});

function StoryLabLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <Outlet />
      </div>
      <div className="py-4 px-8 border-t border-border/40 text-center text-[11px] text-muted-foreground bg-muted/20">
        <span>ShortReel Story Lab • Decision support workspace • Signals are descriptive and require human review</span>
      </div>
    </div>
  );
}
