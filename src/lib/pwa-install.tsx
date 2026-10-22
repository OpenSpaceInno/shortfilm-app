import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { Download, Smartphone, Share2, PlusSquare, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallContextType {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
}

const PwaInstallContext = createContext<PwaInstallContextType | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed PWA)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    checkStandalone();

    // Check for iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setShowInstallGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setCanInstall(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show instructional modal if no direct prompt is available (e.g. iOS or desktop instructions)
      setShowInstallGuide(true);
    }
  }, [deferredPrompt]);

  return (
    <PwaInstallContext.Provider
      value={{
        canInstall,
        isStandalone,
        isIos,
        isInstalled,
        promptInstall,
        showInstallGuide,
        setShowInstallGuide,
      }}
    >
      {children}
      <PwaInstallGuideModal
        open={showInstallGuide}
        onOpenChange={setShowInstallGuide}
        isIos={isIos}
      />
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within a PwaInstallProvider");
  }
  return context;
}

export function PwaInstallGuideModal({
  open,
  onOpenChange,
  isIos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIos: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card border-border p-6 shadow-2xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/20 text-primary">
              <Smartphone className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-display text-foreground">
                Install ShortReel
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Binge interactive vertical series offline & in fullscreen.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isIos ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-3 text-xs text-foreground">
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                  1
                </span>
                <span className="flex-1 flex items-center gap-1.5">
                  Tap the <Share2 className="size-4 text-primary shrink-0" /> <span className="font-semibold">Share</span> button in Safari's toolbar.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                  2
                </span>
                <span className="flex-1 flex items-center gap-1.5">
                  Scroll down & select <PlusSquare className="size-4 text-primary shrink-0" /> <span className="font-semibold">Add to Home Screen</span>.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                  3
                </span>
                <span className="flex-1">
                  Tap <span className="font-semibold text-primary">Add</span> in the top-right corner.
                </span>
              </div>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              ShortReel will appear on your Home Screen as a native app!
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-3 text-xs text-foreground">
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                  1
                </span>
                <span className="flex-1">
                  Look for the <span className="font-semibold text-primary">Install</span> icon in your browser's address bar (or tap the 3 dots menu <span className="font-bold">⋮</span>).
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                  2
                </span>
                <span className="flex-1">
                  Click <span className="font-semibold text-primary">Install ShortReel</span> or <span className="font-semibold text-primary">Add to Home Screen</span>.
                </span>
              </div>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Enjoy fullscreen vertical playback with no browser address bar!
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PwaInstallHeaderButton() {
  const { isStandalone, isInstalled, promptInstall } = usePwaInstall();

  if (isStandalone || isInstalled) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => promptInstall()}
      className="h-8 gap-1.5 rounded-full border-primary/40 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
      title="Install ShortReel as PWA"
    >
      <Download className="size-3.5 shrink-0" />
      <span className="hidden sm:inline">Install</span>
    </Button>
  );
}

export function PwaInstallRow() {
  const { isStandalone, isInstalled, promptInstall } = usePwaInstall();

  return (
    <button
      onClick={() => promptInstall()}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
    >
      <Smartphone className="size-4 text-primary" />
      <div className="flex-1">
        <span className="block text-sm font-medium text-foreground">
          {isStandalone || isInstalled ? "App Installed (PWA)" : "Install ShortReel App"}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {isStandalone || isInstalled
            ? "Running in standalone fullscreen mode"
            : "Add to home screen for fullscreen & offline play"}
        </span>
      </div>
      {isStandalone || isInstalled ? (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
          <Check className="size-3.5" /> Installed
        </span>
      ) : (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
          Install
        </span>
      )}
    </button>
  );
}
