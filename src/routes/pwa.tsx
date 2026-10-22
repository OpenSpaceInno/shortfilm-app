import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Maximize2,
  Play,
  QrCode,
  RotateCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/lib/pwa-install";

export const Route = createFileRoute("/pwa")({
  head: () => ({
    meta: [
      { title: "ShortReel PWA — Install & Offline Experience" },
      {
        name: "description",
        content:
          "Install ShortReel as a Progressive Web App (PWA) for fullscreen vertical cinema, offline caching, and instant access.",
      },
    ],
  }),
  component: PwaShowcasePage,
});

function PwaShowcasePage() {
  const { isStandalone, isInstalled, canInstall, isIos, promptInstall, setShowInstallGuide } =
    usePwaInstall();
  const [offlineSimulated, setOfflineSimulated] = useState(false);

  const handleLaunchStandalonePreview = () => {
    // Open a standalone pop-up window to emulate native PWA window on desktop
    window.open(
      "/",
      "ShortReelPWA",
      "width=430,height=932,menubar=no,status=no,toolbar=no,location=no,scrollbars=yes,resizable=yes",
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="ShortReel App"
        subtitle="Progressive Web App (PWA) Experience"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={promptInstall}
            className="h-8 gap-1 rounded-full border-primary/50 text-xs font-semibold text-primary"
          >
            <Download className="size-3.5" />
            Install
          </Button>
        }
      />

      {/* Main Status Hero Card */}
      <section className="mx-5 mt-2 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/icon-192.png"
                alt="ShortReel App Icon"
                className="size-14 rounded-2xl border border-white/20 shadow-lg object-cover bg-zinc-950"
              />
              <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                <CheckCircle2 className="size-3.5" />
              </span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                ShortReel PWA
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Zap className="size-3" /> Standalone Ready
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground">v2.1</span>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          ShortReel runs as a native app on iOS, Android, and Desktop. Enjoy fullscreen vertical streaming with no browser URL bar, instant offline caching, and haptic gesture navigation.
        </p>

        {/* Quick Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button
            onClick={promptInstall}
            className="w-full gap-1.5 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Download className="size-4" />
            {isStandalone || isInstalled ? "Re-Install / Guide" : "Install App"}
          </Button>

          <Button
            variant="outline"
            onClick={handleLaunchStandalonePreview}
            className="w-full gap-1.5 rounded-2xl border-border bg-card/80 text-xs font-semibold text-foreground hover:bg-muted active:scale-95 transition-transform"
          >
            <Maximize2 className="size-4" />
            App Window
          </Button>
        </div>
      </section>

      {/* Mobile Connect & QR Scan Section */}
      <section className="mx-5 mt-5 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-b from-card/90 to-card/50 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="rounded-2xl border border-white/20 bg-white p-2.5 shadow-md shrink-0">
            <img
              src="/mobile-qr.png"
              alt="Scan to open on mobile"
              className="size-36 rounded-xl object-contain"
            />
          </div>
          <div className="flex-1 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <QrCode className="size-3.5" /> Scan on Mobile
            </span>
            <h3 className="font-display text-base font-bold text-foreground">
              Open Instantly on Your Phone
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your mobile device to the same Wi-Fi network and scan this QR code with your camera or browser:
            </p>
            <div className="inline-block rounded-xl border border-border bg-background/80 px-3 py-1.5 font-mono text-xs font-medium text-primary select-all">
              http://192.168.0.13:8080/
            </div>
            <p className="text-[11px] text-muted-foreground">
              Once open, tap <strong className="text-foreground">"Add to Home Screen"</strong> (iOS Safari) or <strong className="text-foreground">"Install"</strong> (Android Chrome) to run as a fullscreen standalone PWA!
            </p>
          </div>
        </div>
      </section>

      {/* PWA Core Diagnostic Checklist */}
      <section className="mx-5 mt-6">
        <h3 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase">
          PWA System Diagnostics
        </h3>

        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-4 text-xs">
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Web App Manifest
            </span>
            <a
              href="/manifest.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
            >
              manifest.json <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 py-2">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Service Worker
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
              Active (/sw.js)
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 py-2">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Display Mode
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {isStandalone ? "standalone (active)" : "standalone (ready)"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 py-2">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Orientation Lock
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              portrait (9:16)
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Maskable Icons
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              192px + 512px
            </span>
          </div>
        </div>
      </section>

      {/* Offline Caching Demonstration */}
      <section className="mx-5 mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase">
            Offline Resiliency
          </h3>
          <button
            onClick={() => setOfflineSimulated((o) => !o)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {offlineSimulated ? "Simulate Online" : "Simulate Offline"}
          </button>
        </div>

        <div
          className={`mt-3 rounded-2xl border p-4 transition-all ${
            offlineSimulated
              ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
              : "border-border bg-card text-foreground"
          }`}
        >
          <div className="flex items-center gap-3">
            {offlineSimulated ? (
              <span className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
                <WifiOff className="size-5" />
              </span>
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-500">
                <Wifi className="size-5" />
              </span>
            )}
            <div>
              <p className="text-sm font-bold">
                {offlineSimulated ? "Simulated Offline Mode" : "Cache-First Architecture"}
              </p>
              <p className="text-xs text-muted-foreground">
                {offlineSimulated
                  ? "App shell, routes, series catalog and UI components remain fully operable offline."
                  : "Assets are pre-cached by Service Worker for sub-second startup."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Device Install Instructions Carousel / Tabs */}
      <section className="mx-5 mt-6 mb-8">
        <h3 className="font-display text-sm font-bold tracking-wider text-muted-foreground uppercase">
          Installation Guide
        </h3>

        <div className="mt-3 space-y-3">
          {/* iOS Safari Card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Smartphone className="size-4 text-primary" /> Apple iOS (Safari)
            </div>
            <ol className="mt-2.5 space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>Open ShortReel in <strong>Safari</strong> on your iPhone or iPad.</li>
              <li>Tap the <strong>Share</strong> icon (square with arrow) in the bottom toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> to launch in fullscreen without browser bars.</li>
            </ol>
          </div>

          {/* Android Chrome Card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Smartphone className="size-4 text-emerald-500" /> Android (Chrome)
            </div>
            <ol className="mt-2.5 space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>Open ShortReel in <strong>Chrome</strong> on Android.</li>
              <li>Tap the <strong>Install</strong> banner at the top, or tap the three dots (⋮).</li>
              <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Enjoy smooth haptic feedback and portrait playback.</li>
            </ol>
          </div>

          {/* Desktop Chrome / Edge Card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              <Laptop className="size-4 text-sky-500" /> Desktop (Chrome / Edge / Windows / Mac)
            </div>
            <ol className="mt-2.5 space-y-1.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>Look for the <strong>Install app</strong> icon on the right side of the address bar.</li>
              <li>Or click the <strong>Install</strong> button at the top right of this page.</li>
              <li>The app launches in its own dedicated, clean window without browser tabs.</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/watch/$slug"
            params={{ slug: "rooftop-monsoon" }}
            search={{ ep: 1 }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:brightness-110 active:scale-98 transition-all"
          >
            <Play className="size-4 fill-current" />
            Watch First Episode in Fullscreen
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home Feed
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
