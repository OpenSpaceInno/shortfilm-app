import { useState, useRef } from "react";
import {
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  FileVideo,
  Loader2,
  Sparkles,
  Play,
  RotateCw,
  HardDrive,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { uploadVideoFile, type UploadProgress, type UploadState } from "@/lib/video-upload";

interface VideoDirectUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEpisodeId?: string;
  defaultEpisodeTitle?: string;
  onUploadComplete?: (result: { videoId: string; providerUid: string; playbackUrl?: string }) => void;
}

export function VideoDirectUploader({
  isOpen,
  onClose,
  defaultEpisodeId = "ep_pilot_01",
  defaultEpisodeTitle = "Episode 1: The First Frequency",
  onUploadComplete,
}: VideoDirectUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [episodeId, setEpisodeId] = useState(defaultEpisodeId);
  const [episodeTitle, setEpisodeTitle] = useState(defaultEpisodeTitle);
  const [maxDuration, setMaxDuration] = useState<number>(3600);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("video/")) {
      toast.error("Please upload a valid video file (MP4, MOV, WebM).");
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(url);
    setProgress(null);
  };

  const handleStartUpload = async () => {
    if (!file) {
      toast.error("Please select a video file first.");
      return;
    }

    setIsUploading(true);
    toast.info("Requesting Cloudflare Stream direct TUS URL...", {
      description: "Direct chunked upload to Cloudflare global edge network.",
    });

    try {
      const res = await uploadVideoFile(file, {
        episodeId,
        maxDurationSeconds: maxDuration,
        onProgress: (p) => {
          setProgress(p);
        },
        onSuccess: (result) => {
          setIsUploading(false);
          toast.success("Video uploaded and transcoded successfully!", {
            description: `Provider UID: ${result.providerUid.slice(0, 12)}... ready for HLS playback.`,
          });
          onUploadComplete?.(result);
        },
        onError: (err) => {
          setIsUploading(false);
          toast.error("Upload failed", {
            description: err.message,
          });
        },
      });
    } catch (err: any) {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentState = progress?.state || "IDLE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-primary/30 bg-card p-6 shadow-2xl overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
              <Upload className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  Direct TUS Video Upload
                </h3>
                <span className="rounded-md bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Cloudflare Stream
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Resumable 9:16 vertical stream ingestion directly to edge transcoding nodes (P9.2)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Target Episode Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-muted/25 rounded-2xl p-4 border border-border/60">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Target Episode ID
            </label>
            <input
              type="text"
              value={episodeId}
              onChange={(e) => setEpisodeId(e.target.value)}
              disabled={isUploading}
              placeholder="e.g. 01ARZ3NDEKTSV4RRFFQ69G5CR1"
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Episode Title
            </label>
            <input
              type="text"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
              disabled={isUploading}
              placeholder="Episode Title"
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Video Dropzone / Selection */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            className="group cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 p-8 text-center transition-all space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />

            <div className="grid size-14 place-items-center rounded-3xl bg-primary/10 text-primary mx-auto group-hover:scale-105 transition-transform">
              <FileVideo className="size-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Drop your vertical 9:16 master cut here, or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports MP4, MOV, WebM up to 2GB · Optimized for 1080x1920 (9:16) portrait OTT delivery
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Video className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground truncate max-w-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · Type: {file.type || "video/mp4"}
                  </p>
                </div>
              </div>

              {!isUploading && currentState !== "READY" && (
                <button
                  onClick={() => {
                    setFile(null);
                    setVideoPreviewUrl(null);
                    setProgress(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive underline"
                >
                  Change file
                </button>
              )}
            </div>

            {/* Video preview player */}
            {videoPreviewUrl && (
              <div className="relative rounded-xl overflow-hidden bg-black/60 max-h-48 flex justify-center border border-border/70">
                <video
                  src={videoPreviewUrl}
                  controls
                  className="max-h-48 object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Upload Progress & TUS Pipeline State */}
        {progress && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {currentState === "UPLOADING" && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {currentState === "TRANSCODING" && (
                  <RotateCw className="size-4 animate-spin text-amber-400" />
                )}
                {currentState === "READY" && (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                )}
                {currentState === "FAILED" && (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                <span className="font-semibold text-foreground">
                  {currentState === "INITIALIZING" && "Initializing upload session..."}
                  {currentState === "NEGOTIATING_TUS" && "Negotiating Cloudflare Stream TUS token..."}
                  {currentState === "UPLOADING" && `Streaming binary chunks (${progress.speedMbps} Mbps)...`}
                  {currentState === "TRANSCODING" && "Transcoding adaptive multi-bitrate HLS ladder..."}
                  {currentState === "READY" && "Transcoding complete · HLS stream live!"}
                  {currentState === "FAILED" && "Upload encountered an error"}
                </span>
              </div>
              <span className="font-mono font-bold text-primary text-sm">
                {progress.percentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  currentState === "READY"
                    ? "bg-emerald-500"
                    : currentState === "FAILED"
                    ? "bg-destructive"
                    : "bg-gradient-to-r from-primary to-accent"
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Upload Telemetry Stats */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1">
              <div>
                Transferred:{" "}
                <span className="font-semibold text-foreground">
                  {formatBytes(progress.loadedBytes)} / {formatBytes(progress.totalBytes)}
                </span>
              </div>
              <div className="text-center">
                Speed:{" "}
                <span className="font-semibold text-foreground">
                  {progress.speedMbps > 0 ? `${progress.speedMbps} Mbps` : "--"}
                </span>
              </div>
              <div className="text-right">
                Remaining:{" "}
                <span className="font-semibold text-foreground">
                  {progress.remainingSeconds > 0 ? `${progress.remainingSeconds}s` : "--"}
                </span>
              </div>
            </div>

            {/* Error message */}
            {progress.error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2 font-medium">
                {progress.error}
              </p>
            )}

            {/* Success Details */}
            {currentState === "READY" && progress.videoId && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-400">Stream Asset Active</p>
                  <p className="text-muted-foreground text-[11px]">
                    Internal Video ULID: <span className="font-mono text-foreground">{progress.videoId}</span>
                  </p>
                </div>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <ShieldCheck className="size-4" /> Ready for Playback
                </span>
              </div>
            )}
          </div>
        )}

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" /> TUS Resumable Protocol
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400" /> Signed HLS Security
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-sky-400" /> Adaptive Bitrate (ABR)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-full px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {currentState === "READY" ? "Close" : "Cancel"}
          </button>

          {currentState !== "READY" ? (
            <button
              type="button"
              onClick={handleStartUpload}
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>STREAMING CHUNKS...</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>UPLOAD TO CLOUDFLARE STREAM</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-all"
            >
              <CheckCircle2 className="size-3.5" />
              <span>DONE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
