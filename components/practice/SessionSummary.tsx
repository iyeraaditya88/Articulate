"use client";

import { useEffect, useMemo } from "react";
import type { AudioMetrics } from "@/lib/audio/types";

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-0.5 font-mono text-xl ${
          tone === "good"
            ? "text-ok"
            : tone === "warn"
              ? "text-record"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-4 font-display text-base">{title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function SessionSummary({
  metrics,
  audioBlob,
  stage,
  analysisError,
  onAnalyze,
}: {
  metrics: AudioMetrics;
  audioBlob: Blob | null;
  stage: "idle" | "transcribing" | "analyzing" | "done" | "error";
  analysisError: string | null;
  onAnalyze: () => void;
}) {
  const audioUrl = useMemo(
    () => (audioBlob ? URL.createObjectURL(audioBlob) : null),
    [audioBlob],
  );
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const { pitch, volume, pauses, pace } = metrics;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Session summary</h2>
        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            className="h-10 w-full max-w-full sm:w-auto"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Prosody · vocal variety">
          <Stat
            label="Pitch variation"
            value={`${pitch.stdDevSemitones.toFixed(1)} st`}
            hint="std dev, semitones"
            tone={pitch.isMonotone ? "warn" : "good"}
          />
          <Stat
            label="Range"
            value={`${pitch.rangeSemitones.toFixed(1)} st`}
            hint="p5–p95 spread"
          />
          <Stat
            label="Median pitch"
            value={pitch.medianHz > 0 ? `${pitch.medianHz.toFixed(0)} Hz` : "—"}
          />
          <Stat
            label="Verdict"
            value={pitch.isMonotone ? "Monotone" : "Varied"}
            tone={pitch.isMonotone ? "warn" : "good"}
            hint={
              pitch.isMonotone
                ? "Try stretching your melody"
                : "Engaging melodic range"
            }
          />
        </Card>

        <Card title="Volume">
          <Stat
            label="Average level"
            value={`${volume.meanDb.toFixed(0)} dB`}
            tone={volume.tooQuiet ? "warn" : "neutral"}
            hint={volume.tooQuiet ? "Too quiet — project more" : undefined}
          />
          <Stat
            label="Dynamics"
            value={`${volume.stdDevDb.toFixed(1)} dB`}
            hint="variation while speaking"
          />
          <Stat
            label="Clipping"
            value={`${(volume.clippedRatio * 100).toFixed(1)}%`}
            tone={volume.clippedRatio > 0.01 ? "warn" : "good"}
          />
        </Card>

        <Card title="Pauses · silence">
          <Stat label="Pauses" value={String(pauses.count)} hint="> 300 ms" />
          <Stat
            label="Long pauses"
            value={String(pauses.longCount)}
            hint="> 1 s"
          />
          <Stat
            label="Average pause"
            value={pauses.count > 0 ? `${(pauses.meanMs / 1000).toFixed(1)} s` : "—"}
          />
          <Stat
            label="Speaking ratio"
            value={`${(pauses.speakingRatio * 100).toFixed(0)}%`}
            hint="of session spent talking"
          />
        </Card>

        <Card title="Pace (estimate)">
          <Stat
            label="Words / min"
            value={`~${pace.estWordsPerMin.toFixed(0)}`}
            hint="refined after transcription"
          />
          <Stat
            label="Syllables / min"
            value={`~${pace.estSyllablesPerMin.toFixed(0)}`}
          />
          <Stat
            label="Speech segments"
            value={String(pace.speechSegmentCount)}
          />
          <Stat
            label="Duration"
            value={`${(metrics.durationMs / 1000).toFixed(0)} s`}
          />
        </Card>
      </div>

      {stage !== "done" && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <button
            onClick={onAnalyze}
            disabled={stage === "transcribing" || stage === "analyzing"}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {stage === "transcribing" && (
              <span className="size-3 animate-spin rounded-full border-2 border-background/40 border-t-background" />
            )}
            {stage === "analyzing" && (
              <span className="size-3 animate-spin rounded-full border-2 border-background/40 border-t-background" />
            )}
            {stage === "transcribing"
              ? "Transcribing…"
              : stage === "analyzing"
                ? "Analyzing — about a minute…"
                : "Get coaching analysis"}
          </button>
          <p className="text-xs text-muted">
            Transcribes your audio, then scores it against HAIL, the 7 Sins,
            the Vocal Toolbox, rhetoric, and more.{" "}
            <span className="text-foreground">
              A deep analysis takes about a minute
            </span>{" "}
            — worth the wait.
          </p>
          {stage === "error" && analysisError && (
            <p className="w-full text-sm text-record">{analysisError}</p>
          )}
        </div>
      )}
    </section>
  );
}
