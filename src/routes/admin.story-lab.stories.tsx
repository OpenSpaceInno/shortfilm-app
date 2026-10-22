import { createFileRoute, Outlet } from "@tanstack/react-router";

/* ==========================================================================
   STORY LAB — STORIES LAYOUT
   Route: /admin/story-lab/stories
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/stories")({
  component: StoryLabStoriesLayout,
});

function StoryLabStoriesLayout() {
  return <Outlet />;
}
