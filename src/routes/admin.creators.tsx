import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/creators")({
  head: () => ({ meta: [{ title: "Creator Operations — ShortReel Admin" }] }),
  component: AdminCreatorsLayout,
});

function AdminCreatorsLayout() {
  return <Outlet />;
}
