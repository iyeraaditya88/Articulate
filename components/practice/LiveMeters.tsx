"use client";

import { useEffect, useRef } from "react";
import type { LiveAudioState } from "@/lib/audio/types";

const SPARK_SECONDS = 5;
const SPARK_POINTS = 50;
const PITCH_MIN = 50;
const PITCH_MAX = 400;

function VolumeBar({ db, isClipping }: { db: number; isClipping: boolean }) {
  // Map −60..0 dBFS to 0..100%.
  const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  const color = isClipping
    ? "bg-record"
    : pct > 80
      ? "bg-amber-500"
      : "bg-ok";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PitchSparkline({ live }: { live: LiveAudioState }) {
  // Rolling buffer fed per render tick (~10 Hz) — enough for a 5 s trace.
  const bufferRef = useRef<(number | null)[]>([]);

  useEffect(() => {
    const buf = bufferRef.current;
    buf.push(live.status === "recording" ? live.pitchHz : null);
    if (buf.length > SPARK_POINTS) buf.shift();
  }, [live]);

  const buf = bufferRef.current;
  const w = 200;
  const h = 40;
  const points = buf
    .map((hz, i) => {
      if (hz === null) return null;
      const x = (i / (SPARK_POINTS - 1)) * w;
      const clamped = Math.max(PITCH_MIN, Math.min(PITCH_MAX, hz));
      // Log scale reads more naturally for pitch.
      const yNorm =
        (Math.log2(clamped) - Math.log2(PITCH_MIN)) /
        (Math.log2(PITCH_MAX) - Math.log2(PITCH_MIN));
      return `${x.toFixed(1)},${(h - yNorm * h).toFixed(1)}`;
    })
    .filter(Boolean);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-10 w-full text-accent"
      preserveAspectRatio="none"
      aria-hidden
    >
      {points.length > 1 && (
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function LiveMeters({ live }: { live: LiveAudioState }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted">
          <span>Volume</span>
          <span className="font-mono">
            {live.db > -80 ? `${live.db.toFixed(0)} dB` : "—"}
          </span>
        </div>
        <VolumeBar db={live.db} isClipping={live.isClipping} />
        {live.isClipping && (
          <p className="mt-2 text-xs text-record">Clipping — back off the mic</p>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Pitch</span>
          <span className="font-mono">
            {live.pitchHz ? `${live.pitchHz.toFixed(0)} Hz` : "unvoiced"}
          </span>
        </div>
        <div className={live.pitchHz ? "" : "opacity-40"}>
          <PitchSparkline live={live} />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 text-xs text-muted">Flow</div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              live.isSpeaking
                ? "bg-accent-soft text-accent"
                : "bg-surface-raised text-muted"
            }`}
          >
            {live.isSpeaking ? "Speaking" : "Pause"}
          </span>
          <span className="text-xs text-muted">
            {live.pauseCount} pause{live.pauseCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

export { SPARK_SECONDS };
