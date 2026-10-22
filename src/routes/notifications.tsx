import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { NotificationCard } from "@/components/engagement";
import { characters, notifications } from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ShortReel" },
      {
        name: "description",
        content:
          "Live story votes, closing polls, new episodes, prediction results and updates from the characters you follow.",
      },
      { property: "og:title", content: "Notifications — ShortReel" },
      {
        property: "og:description",
        content: "Never miss a vote, an episode drop or a character moment.",
      },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { markAllRead, unreadCount, followedCharacters } = useEngagement();
  const followed = characters.filter((c) => followedCharacters.includes(c.id));

  return (
    <AppShell>
      <PageHeader title="Notifications" subtitle="Your stories, while you were away." />

      <div className="flex items-center justify-between px-5">
        <span className="text-xs text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
        </span>
        <button onClick={markAllRead} className="text-xs font-semibold text-primary">
          Mark all read
        </button>
      </div>

      <div className="mt-3 space-y-2 px-5">
        {notifications.map((n) => (
          <NotificationCard key={n.id} item={n} />
        ))}
      </div>

      {followed.length > 0 ? (
        <section className="mt-7 px-5">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            Character alerts on
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            You'll hear about new episodes and moments for{" "}
            {followed.map((c) => c.name).join(", ")}.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
