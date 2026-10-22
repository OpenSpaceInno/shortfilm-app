import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Captions,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Crown,
  Heart,
  List,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDuration, getSeries } from "@/lib/catalog";
import { contentApi, interactiveApi, engagementApi } from "@/lib/api-client";
import { InteractiveEpisodeOverlay } from "@/components/interactive-overlay";
import { InteractiveBadge } from "@/components/interactive";
import { getChoiceFor, isInteractive } from "@/lib/interactive";
import { ShareSheet } from "@/components/engagement";
import { useEngagement } from "@/lib/engagement-state";
import { useStoryState } from "@/lib/story-state";
import { getEpisodeScene, ambientAudio } from "@/lib/episode-scenes";
import { z } from "zod";

const searchSchema = z.object({ ep: z.coerce.number().int().min(1).catch(1) });

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const item = getSeries(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Episode unavailable — ShortReel" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { item } = loaderData;
    return {
      meta: [
        { title: `Watch ${item.title} — ShortReel` },
        {
          name: "description",
          content: `Stream ${item.title} episodes in vertical full screen on ShortReel.`,
        },
        { property: "og:title", content: `Watch ${item.title} — ShortReel` },
        { property: "og:description", content: item.tagline },
      ],
    };
  },
  component: Watch,
});

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

function Watch() {
  const { item } = Route.useLoaderData();
  const { ep } = Route.useSearch();
  const navigate = Route.useNavigate();

  // Engagement & VIP status
  const { isVip, isEpisodeLiked, toggleLikeEpisode, awardXp } = useEngagement();
  const { recordChoice, choiceFor } = useStoryState();

  const episodes = item.seasons[0]!.episodes;
  const current = episodes.find((e) => e.number === ep) ?? episodes[0]!;
  // VIP subscribers unlock all episodes immediately!
  const locked = current.premium && !isVip;

  // Scene data specific to this episode
  const scene = getEpisodeScene(item.slug, current.number, item.genres);

  // Cloudflare Stream playback query
  const { data: streamData } = useQuery({
    queryKey: ['stream', current.id],
    queryFn: async () => {
      const res = await contentApi.getPlaybackStream(current.id);
      return res.success ? res.data : null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const activeVideoUrl = streamData?.manifestUrl || streamData?.streamUrl || scene.videoUrl;

  // Video playback
  const [playing, setPlaying] = useState(true);
  const [playbackSec, setPlaybackSec] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [playPulse, setPlayPulse] = useState<"play" | "pause" | null>(null);

  const effectiveDuration = videoDuration && videoDuration > 0
    ? videoDuration
    : (streamData?.durationSeconds && streamData.durationSeconds > 0 ? streamData.durationSeconds : current.durationSec);

  // Overlay sheets
  const [showList, setShowList] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [share, setShare] = useState(false);

  // Floating heart burst on double-tap
  const [heartBursts, setHeartBursts] = useState<HeartBurst[]>([]);

  // Gesture refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelCooldown = useRef<number>(0);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);

  const interactive = isInteractive(item.slug);
  const choice = getChoiceFor(item.slug, current.number);
  const previous = choice ? choiceFor(choice.id) : undefined;
  const liked = isEpisodeLiked(current.id);

  // Sync watch progress to engagement engine
  useEffect(() => {
    if (locked || playbackSec <= 0) return;
    const isCompleted = playbackSec >= effectiveDuration - 1;
    if (playbackSec % 5 === 0 || isCompleted) {
      engagementApi.syncProgress({
        storyId: item.slug,
        episodeId: current.id,
        positionSeconds: playbackSec,
        durationSeconds: effectiveDuration,
        completed: isCompleted,
      }).catch(() => {});
    }
  }, [playbackSec, current.id, effectiveDuration, item.slug, locked]);

  const handleChoiceSelect = async (option: any) => {
    if (!choice) return;
    recordChoice({
      choiceId: choice.id,
      seriesSlug: item.slug,
      episodeNumber: choice.episodeNumber,
      option,
      label: choice.options.find((o) => o.id === option)?.label || String(option),
    });
    if (!previous) awardXp("vote", "Story vote");

    try {
      await interactiveApi.resolveChoice({
        choiceId: choice.id,
        optionId: option,
        episodeId: current.id,
        timeToDecideMs: 2500,
      });
    } catch {
      // optimistic state preserved locally
    }
  };

  // Find active live dialogue caption
  const activeCaption = scene.captions.find(
    (c) => playbackSec >= c.startSec && playbackSec <= c.endSec,
  );

  const go = useCallback(
    (n: number) => {
      if (n >= 1 && n <= episodes.length) {
        navigate({ search: { ep: n } });
        setVideoDuration(null);
        setPlaybackSec(0);
        setPlaying(true);
      }
    },
    [episodes.length, navigate],
  );

  // Reset playback timer and show title cue when episode changes
  useEffect(() => {
    setVideoDuration(null);
    setPlaybackSec(0);
    setPlaying(true);
    setSwipeHint(`EP ${current.number} · ${scene.title}`);
    const t = setTimeout(() => setSwipeHint(null), 3000);
    return () => clearTimeout(t);
  }, [current.id, current.number, scene.title]);

  // Video playback control
  useEffect(() => {
    if (!videoRef.current) return;
    if (playing && !locked) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playing, locked, scene.videoUrl]);

  // Ambient soundscape audio engine
  useEffect(() => {
    if (playing && !locked && !muted) {
      ambientAudio.start(scene.soundType);
    } else {
      ambientAudio.stop();
    }
    return () => ambientAudio.stop();
  }, [playing, locked, muted, scene.soundType]);

  // Fallback running timer if video is not available or hasn't started
  useEffect(() => {
    if (scene.videoUrl && videoRef.current) return;
    if (!playing || locked) return;
    const interval = setInterval(() => {
      setPlaybackSec((prev) => {
        if (prev >= effectiveDuration) {
          // Episode finished
          if (choice && !showChoice) {
            setShowChoice(true);
          }
          return effectiveDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playing, locked, effectiveDuration, choice, showChoice, scene.videoUrl]);

  // Watching an episode earns XP
  useEffect(() => {
    if (locked) return;
    const t = setTimeout(() => awardXp("watchEpisode", `EP ${current.number} started`), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id, locked]);

  // Keyboard navigation (Arrow keys / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        go(current.number + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        go(current.number - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
        setPlayPulse(playing ? "pause" : "play");
        setTimeout(() => setPlayPulse(null), 550);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current.number, go, playing]);

  // Touch Swipe for Mobile / Web App (Shorts & Reels gesture)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartY.current;
    const deltaX = touch.clientX - touchStartX.current;
    const duration = Date.now() - touchStartTime.current;

    // Reset touch start
    touchStartY.current = null;
    touchStartX.current = null;

    // Must be primarily a vertical swipe and fast/significant enough
    if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2 && duration < 600) {
      if (deltaY < -40) {
        // Swiped UP -> Next Episode
        if (current.number < episodes.length) {
          go(current.number + 1);
        } else {
          toast("You've reached the latest episode of this season!", { duration: 2000 });
        }
      } else if (deltaY > 40) {
        // Swiped DOWN -> Previous Episode
        if (current.number > 1) {
          go(current.number - 1);
        }
      }
    }
  };

  // Wheel scrolling (Desktop parity)
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - wheelCooldown.current < 700) return;

    if (e.deltaY > 60 && current.number < episodes.length) {
      wheelCooldown.current = now;
      go(current.number + 1);
    } else if (e.deltaY < -60 && current.number > 1) {
      wheelCooldown.current = now;
      go(current.number - 1);
    }
  };

  // Stage click: handle Single Tap (Play/Pause) vs Double Tap (Like + Heart burst)
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSinceLastTap < 300) {
      // DOUBLE TAP DETECTED!
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newHeart: HeartBurst = { id: Date.now(), x, y };
      setHeartBursts((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setHeartBursts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 900);

      if (!liked) {
        toggleLikeEpisode(current.id);
        awardXp("like", "Liked episode");
        toast.success("Added to Liked episodes ❤️", { duration: 1500 });
      }
    } else {
      // SINGLE TAP (delay to differentiate from double tap)
      tapTimeoutRef.current = setTimeout(() => {
        if (!locked) {
          const nextState = !playing;
          setPlaying(nextState);
          setPlayPulse(nextState ? "play" : "pause");
          setTimeout(() => setPlayPulse(null), 550);
        }
      }, 250);
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} EP ${current.number} · ${scene.title}`,
          text: `Watch ${item.title} — EP ${current.number} (${scene.title}) on ShortReel!`,
          url: window.location.href,
        });
        awardXp("share", "Shared episode");
        toast.success("Thanks for sharing!");
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setShare(true);
        }
      }
    } else {
      setShare(true);
    }
  };
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newSec = Math.floor(pct * effectiveDuration);
    setPlaybackSec(newSec);
    if (videoRef.current) {
      videoRef.current.currentTime = newSec;
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSec(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setPlaying(true);
  };

  const progressPct = locked
    ? 0
    : Math.min(100, (playbackSec / Math.max(1, effectiveDuration)) * 100);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-black select-none touch-none"
    >
      {/* Dynamic Video & Scene Visual Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {activeVideoUrl ? (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            poster={streamData?.thumbnailUrl || scene.scenePoster}
            playsInline
            loop={false}
            muted={muted}
            autoPlay
            onTimeUpdate={(e) => {
              setPlaybackSec(Math.floor(e.currentTarget.currentTime));
            }}
            onLoadedMetadata={(e) => {
              const dur = Math.floor(e.currentTarget.duration);
              if (!isNaN(dur) && dur > 0) {
                setVideoDuration(dur);
              }
            }}
            onEnded={() => {
              setPlaying(false);
              if (choice && !showChoice) {
                setShowChoice(true);
              }
            }}
            style={{ filter: scene.gradeFilter }}
            className={`h-full w-full object-cover transition-all duration-700 ${
              playing && !locked ? "scale-105" : "scale-100"
            } ${locked ? "blur-xl brightness-30" : "brightness-95"}`}
          />
        ) : (
          <img
            src={scene.scenePoster}
            alt={`${item.title} — ${scene.title}`}
            width={608}
            height={1088}
            style={{ filter: scene.gradeFilter }}
            className={`h-full w-full object-cover transition-all duration-1000 ease-out ${
              playing && !locked ? "animate-ken-burns scale-105" : "scale-100"
            } ${locked ? "blur-xl brightness-30" : "brightness-95"}`}
          />
        )}
        {/* Subtle cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95 pointer-events-none" />
      </div>

      {/* Interactive Tap Area (Play/Pause & Double-tap Heart) */}
      {!locked && (
        <div
          onClick={handleStageClick}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label="Tap to play/pause or double tap to like"
        />
      )}

      {/* Heart Burst Animations on Double Tap */}
      {heartBursts.map((hb) => (
        <div
          key={hb.id}
          style={{ left: hb.x, top: hb.y }}
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 animate-heart-burst"
        >
          <Heart className="size-20 fill-rose-500 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
        </div>
      ))}

      {/* Central Pause Overlay Indicator (when paused and not showing sheets) */}
      {!playing && !locked && !showChoice && !showList && (
        <div
          onClick={() => {
            setPlaying(true);
            setPlayPulse("play");
            setTimeout(() => setPlayPulse(null), 550);
          }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px]"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl ring-4 ring-primary/30 transition-transform">
            <Play className="size-8 fill-current translate-x-0.5" />
          </div>
          <span className="mt-3 text-xs font-semibold text-white/90 drop-shadow">
            Paused · Tap anywhere to resume
          </span>
        </div>
      )}

      {/* Play / Pause Feedback Pulse */}
      {playPulse && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="animate-play-pulse rounded-full bg-black/60 p-6 text-white backdrop-blur-md">
            {playPulse === "play" ? (
              <Play className="size-10 fill-white translate-x-0.5" />
            ) : (
              <Pause className="size-10" />
            )}
          </div>
        </div>
      )}

      {/* Live Dialogue Captions / Subtitles Overlay (Video Feel) */}
      {showCaptions && activeCaption && !locked && (
        <div className="pointer-events-none absolute bottom-28 left-4 right-4 z-20 flex justify-center">
          <div className="max-w-[92%] rounded-xl border border-white/15 bg-black/80 px-3.5 py-2 text-center shadow-2xl backdrop-blur-md transition-all">
            <span className="mr-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              {activeCaption.speaker}:
            </span>
            <span className="text-xs font-medium text-white drop-shadow-sm">
              {activeCaption.text}
            </span>
          </div>
        </div>
      )}

      {/* Swipe Episode Hint Banner */}
      {swipeHint && (
        <div className="pointer-events-none absolute top-16 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-xl transition-opacity duration-300">
          {swipeHint}
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="relative z-20 flex w-full items-center justify-between px-4 pt-safe pt-4">
        <Link
          to="/series/$slug"
          params={{ slug: item.slug }}
          aria-label="Back to series"
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="text-center">
          <p className="text-xs font-bold text-white drop-shadow-sm">{item.title}</p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/80">
            <span>EP {current.number} · {scene.title}</span>
            <span>·</span>
            {/* Equalizer audio wave animation */}
            {playing && !locked && !muted ? (
              <span className="inline-flex items-end gap-0.5 h-3 px-1">
                <span className="w-0.5 bg-primary rounded-full animate-soundwave-1" />
                <span className="w-0.5 bg-primary rounded-full animate-soundwave-2" />
                <span className="w-0.5 bg-primary rounded-full animate-soundwave-3" />
                <span className="w-0.5 bg-primary rounded-full animate-soundwave-4" />
              </span>
            ) : null}
            <span>{formatDuration(playbackSec)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Subtitles Toggle */}
          <button
            aria-label={showCaptions ? "Hide subtitles" : "Show subtitles"}
            onClick={(e) => {
              e.stopPropagation();
              setShowCaptions((c) => !c);
              toast(showCaptions ? "Subtitles off" : "Subtitles on", { duration: 1200 });
            }}
            className={`rounded-full p-2.5 text-white backdrop-blur-md border transition-all ${
              showCaptions ? "bg-primary/30 border-primary/50 text-primary" : "bg-black/50 border-white/10 text-white/70"
            }`}
          >
            <Captions className="size-4" />
          </button>

          {/* Volume Mute Toggle */}
          <button
            aria-label={muted ? "Unmute audio" : "Mute audio"}
            onClick={(e) => {
              e.stopPropagation();
              const next = !muted;
              setMuted(next);
              if (videoRef.current) {
                videoRef.current.muted = next;
              }
              toast(next ? "Sound muted" : "Sound unmuted", { duration: 1200 });
            }}
            className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
          >
            {muted ? <VolumeX className="size-4 text-rose-400" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Center: Paywall if episode is locked */}
      {locked && (
        <div className="relative z-30 flex h-[75%] flex-col items-center justify-center px-8 text-center">
          <span className="rounded-full bg-amber-500/20 p-4 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Crown className="size-8" />
          </span>
          <h2 className="mt-4 font-display text-2xl tracking-wide text-white">VIP Episode</h2>
          <p className="mt-2 text-sm text-white/70">
            EP {current.number} · {scene.title} is exclusive to VIP members. Unlock the complete season with a VIP pass.
          </p>
          <Link
            to="/plans"
            search={{ returnTo: `/watch/${item.slug}?ep=${current.number}` }}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-500 to-primary py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all text-center"
          >
            Unlock with VIP Access
          </Link>
          <button
            onClick={() => go(current.number - 1)}
            className="mt-4 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            ← Back to EP {current.number - 1}
          </button>
        </div>
      )}

      {/* Right Rail: Shorts / Reels Action Buttons */}
      <div className="absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col items-center gap-4">
        {/* Previous Episode */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            go(current.number - 1);
          }}
          aria-label="Previous episode"
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md border border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
          disabled={current.number === 1}
        >
          <ChevronUp className="size-5" />
        </button>

        {/* Like Button */}
        <button
          aria-label={liked ? "Unlike episode" : "Like episode"}
          onClick={(e) => {
            e.stopPropagation();
            toggleLikeEpisode(current.id);
            if (!liked) awardXp("like", "Liked episode");
          }}
          className="flex flex-col items-center gap-1 text-white group active:scale-125 transition-transform"
        >
          <div
            className={`rounded-full p-2.5 backdrop-blur-md border transition-all ${
              liked
                ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-md shadow-rose-500/20"
                : "bg-black/50 border-white/10 text-white"
            }`}
          >
            <Heart
              className={`size-5 transition-colors ${liked ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </div>
          <span
            className={`text-[10px] drop-shadow ${liked ? "font-bold text-rose-400" : "text-white/80"}`}
          >
            {liked ? "24.1k" : "24k"}
          </span>
        </button>

        {/* Share Button */}
        <button
          aria-label="Share episode"
          onClick={(e) => {
            e.stopPropagation();
            handleShareClick();
          }}
          className="flex flex-col items-center gap-1 text-white group active:scale-125 transition-transform"
        >
          <div className="rounded-full bg-black/50 p-2.5 backdrop-blur-md border border-white/10 text-white shadow-md">
            <Share2 className="size-5" />
          </div>
          <span className="text-[10px] text-white/80 drop-shadow">Share</span>
        </button>

        {/* Episode Selector Sheet */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowList(true);
          }}
          aria-label="Episode list"
          className="flex flex-col items-center gap-1 text-white group active:scale-125 transition-transform"
        >
          <div className="rounded-full bg-black/50 p-2.5 backdrop-blur-md border border-white/10 text-white shadow-md">
            <List className="size-5" />
          </div>
          <span className="text-[10px] text-white/80 drop-shadow">Eps</span>
        </button>

        {/* Next Episode */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            go(current.number + 1);
          }}
          aria-label="Next episode"
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md border border-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
          disabled={current.number === episodes.length}
        >
          <ChevronDown className="size-5" />
        </button>
      </div>

      {/* Bottom Info + Scrubber Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-safe pb-5 pt-8 bg-gradient-to-t from-black via-black/85 to-transparent">
        <div className="flex items-center justify-between text-xs font-semibold text-white">
          <p className="line-clamp-1 drop-shadow">
            EP {current.number} · {scene.title}
          </p>
          <span className="text-[11px] font-mono text-white/70">
            {formatDuration(playbackSec)} / {formatDuration(effectiveDuration)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-white/75 drop-shadow">
          {scene.synopsisSnippet || item.tagline}
        </p>

        {/* Interactive Running Video Scrubber Line */}
        <div
          role="slider"
          aria-label="Seek video playback"
          aria-valuenow={playbackSec}
          aria-valuemin={0}
          aria-valuemax={effectiveDuration}
          tabIndex={0}
          onClick={handleScrub}
          className="group relative mt-2.5 h-3.5 w-full cursor-pointer flex items-center select-none"
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20 group-hover:h-2 transition-all">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-white shadow-md border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
        </div>

        {/* Replay or Next or Interactive Choice */}
        {playbackSec >= effectiveDuration - 1 && !choice ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black/80 active:scale-95 transition-all shadow-md"
            >
              <RotateCcw className="size-3.5" /> Replay
            </button>
            {current.number < episodes.length ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(current.number + 1);
                }}
                className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                Next EP {current.number + 1} →
              </button>
            ) : (
              <span className="text-xs text-white/70">Season Complete</span>
            )}
          </div>
        ) : choice && !locked ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChoice(true);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 bg-primary/20 py-2.5 text-xs font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/10 active:scale-98 transition-all"
          >
            <Sparkles className="size-4 animate-spin" />
            {previous ? `Your choice: path ${previous.option}` : "Make your story choice"}
          </button>
        ) : (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/60">
            <span>Swipe up for next episode</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </div>
        )}
      </div>

      {/* Interactive Badge */}
      {interactive ? (
        <div className="absolute top-16 left-4 z-20">
          <InteractiveBadge />
        </div>
      ) : null}

      {/* Episode Selector Bottom Sheet with Rich Scene Previews */}
      {showList && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md">
          <button
            aria-label="Close episode list"
            className="flex-1"
            onClick={() => setShowList(false)}
          />
          <div className="max-h-[70%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg tracking-wide text-foreground">
                  Season 1 Episodes
                </p>
                <p className="text-xs text-muted-foreground">{episodes.length} episodes available</p>
              </div>
              <button
                onClick={() => setShowList(false)}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {episodes.map((e) => {
                const eScene = getEpisodeScene(item.slug, e.number, item.genres);
                const isEpLocked = e.premium && !isVip;
                const isCurrent = e.number === current.number;

                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      go(e.number);
                      setShowList(false);
                    }}
                    className={`group flex w-full items-center gap-3 overflow-hidden rounded-xl border p-2 text-left transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                        : "border-border bg-card/60 hover:bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-black">
                      <img
                        src={eScene.thumbnail}
                        alt={e.title}
                        width={88}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white">
                        {e.number}
                      </span>
                      {isCurrent && (
                        <div className="absolute inset-0 grid place-items-center bg-primary/40">
                          <Play className="size-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="line-clamp-1 text-xs font-semibold text-foreground">
                          EP {e.number} · {eScene.title}
                        </p>
                        {isEpLocked ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                            <Crown className="size-2.5" /> VIP
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {eScene.synopsisSnippet}
                      </p>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground/80 font-mono">
                        {formatDuration(e.durationSec)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Story Decision Point Overlay */}
      {choice && showChoice && !locked ? (
        <InteractiveEpisodeOverlay
          choice={choice}
          existing={previous?.option}
          onSelect={handleChoiceSelect}
          onContinue={() => {
            setShowChoice(false);
            go(current.number + 1);
          }}
          onDismiss={() => setShowChoice(false)}
        />
      ) : null}

      {/* Share Sheet */}
      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title={`${item.title} EP ${current.number} · ${scene.title}`}
        message={
          previous
            ? `I chose PATH ${previous.option} in ${item.title}. What would you choose?`
            : `${item.title} — EP ${current.number} (${scene.title}) on ShortReel. ${item.tagline}`
        }
        kinds={["Episode", "Choice", "Prediction", "Story outcome"]}
      />
    </div>
  );
}
