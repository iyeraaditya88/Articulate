"use client";

import type { RecorderStatus } from "@/lib/audio/types";

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecordingControls({
  status,
  isSupported,
  error,
  elapsedMs,
  onStart,
  onStop,
  onReset,
}: {
  status: RecorderStatus;
  isSupported: boolean;
  error: string | null;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const recording = status === "recording";

  return (
    <div className="flex flex-wrap items-center gap-4">
      {recording ? (
        <button
          onClick={onStop}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-record px-6 py-3.5 text-[15px] font-medium text-white transition hover:brightness-110 sm:w-auto"
        >
          <span className="size-3 rounded-[3px] bg-white" />
          Stop
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={!isSupported || status === "requesting"}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <span className="size-3 rounded-full bg-record" />
          {status === "requesting" ? "Requesting mic…" : "Start recording"}
        </button>
      )}

      {recording && (
        <span className="flex items-center gap-2 font-mono text-sm text-foreground">
          <span className="size-2 animate-pulse rounded-full bg-record" />
          {formatElapsed(elapsedMs)}
        </span>
      )}

      {status === "stopped" && (
        <button
          onClick={onReset}
          className="rounded-full border border-line px-5 py-3 text-sm text-muted transition hover:border-accent hover:text-foreground"
        >
          New session
        </button>
      )}

      {!isSupported && status === "idle" && (
        <p className="text-sm text-muted">
          Checking microphone support… If this persists, your browser may not
          support recording.
        </p>
      )}

      {error && <p className="text-sm text-record">{error}</p>}
    </div>
  );
}
