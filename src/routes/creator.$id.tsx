import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { CreatorProfile } from "@/components/creator-ecosystem";
import { creators, getCreator } from "@/lib/creators";

export const Route = createFileRoute("/creator/$id")({
  head: ({ params }) => {
    const creator = getCreator(params.id) ?? creators[0]!;
    return {
      meta: [
        { title: `${creator.name} — ShortReel Creator Profile` },
        {
          name: "description",
          content: `${creator.bio} Explore original vertical interactive series and stories by ${creator.name}.`,
        },
        { property: "og:title", content: `${creator.name} — ShortReel Creator` },
        { property: "og:description", content: creator.tagline },
      ],
    };
  },
  component: CreatorDetailPage,
});

function CreatorDetailPage() {
  const { id } = Route.useParams();
  const creator = getCreator(id) ?? creators[0]!;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Creator profile link copied to clipboard!");
  };

  return (
    <AppShell>
      {/* Top Bar with Back Link */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <Link
          to="/creators"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> All Creators
        </Link>
        <button
          onClick={handleShare}
          className="rounded-full border border-border bg-card/80 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Share Creator Profile"
        >
          <Share2 className="size-4" />
        </button>
      </div>

      <div className="px-5 pt-2 pb-6">
        <CreatorProfile creator={creator} />
      </div>
    </AppShell>
  );
}
