"use client";

import Link from "next/link";
import type { SpeechAnalysis } from "@/lib/analysis/types";
import {
  RADAR_AXES,
  SIN_LABELS,
  VOICE_TYPE_LABELS,
} from "@/lib/analysis/types";
import { RadarChart } from "@/components/charts/RadarChart";
import { findLessonByFocus } from "@/lib/lessons/content";

function gradeTone(grade: string): string {
  if (grade === "A") return "text-ok";
  if (grade === "B") return "text-accent";
  return "text-record";
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 84 84" className="size-24 -rotate-90">
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="7"
        />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-xl">
        {score}
      </span>
    </div>
  );
}

function Bar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.max(2, Math.min(score, 100))}%` }}
      />
    </div>
  );
}

export function AnalysisPanel({ analysis }: { analysis: SpeechAnalysis }) {
  const radarValues = RADAR_AXES.map((a) =>
    Math.round(analysis.radar[a.key].score),
  );
  const detectedSins = SIN_LABELS.filter((s) => analysis.sins[s.key].detected);

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center gap-5">
          <ScoreRing score={analysis.overallScore} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-wider text-accent">
                {analysis.speakerType}
              </p>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs text-foreground">
                {VOICE_TYPE_LABELS[analysis.voice.type] ?? analysis.voice.type}{" "}
                voice
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl leading-snug">
              {analysis.headline}
            </h2>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {analysis.summary}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {analysis.voice.description}
        </p>
      </div>

      {/* Speaker profile web */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="mb-2 font-display text-lg">Your speaker profile</h3>
        <RadarChart
          labels={RADAR_AXES.map((a) => a.label)}
          values={radarValues}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {RADAR_AXES.map((a) => (
            <div key={a.key} className="text-[13px] leading-relaxed">
              <span className="text-foreground">{a.label}:</span>{" "}
              <span className="text-muted">
                {analysis.radar[a.key].comment}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* HAIL */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-1 font-display text-lg">HAIL</h3>
          <p className="mb-4 text-xs text-muted">
            Julian Treasure&apos;s four foundations of powerful speech
          </p>
          <ul className="space-y-3">
            {(
              [
                ["Honesty", analysis.hail.honesty],
                ["Authenticity", analysis.hail.authenticity],
                ["Integrity", analysis.hail.integrity],
                ["Love", analysis.hail.love],
              ] as const
            ).map(([label, g]) => (
              <li key={label} className="flex gap-3 text-sm">
                <span
                  className={`w-6 shrink-0 font-mono text-lg ${gradeTone(g.grade)}`}
                >
                  {g.grade}
                </span>
                <div>
                  <p>{label}</p>
                  <p className="text-xs text-muted">{g.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Seven sins */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-1 font-display text-lg">Seven Deadly Sins</h3>
          <p className="mb-4 text-xs text-muted">
            {detectedSins.length === 0
              ? "Clean sheet — none detected in this recording."
              : `${detectedSins.length} detected in this recording`}
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {SIN_LABELS.map((s) => {
              const finding = analysis.sins[s.key];
              return (
                <li
                  key={s.key}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    finding.detected
                      ? "border-record/40 bg-record/10 text-foreground"
                      : "border-line bg-surface-raised/50 text-muted"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {s.label}
                    <span>{finding.detected ? "✗" : "✓"}</span>
                  </span>
                  {finding.detected && finding.evidence && (
                    <span className="mt-1 block italic text-muted">
                      &ldquo;{finding.evidence}&rdquo;
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Vocal toolbox */}
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-1 font-display text-lg">Vocal Toolbox</h3>
          <p className="mb-4 text-xs text-muted">
            The six instruments of delivery, grounded in your measured audio
          </p>
          <ul className="space-y-4">
            {(
              [
                ["Register", analysis.vocalToolbox.register],
                ["Timbre", analysis.vocalToolbox.timbre],
                ["Prosody", analysis.vocalToolbox.prosody],
                ["Pace", analysis.vocalToolbox.pace],
                ["Pitch", analysis.vocalToolbox.pitch],
                ["Volume", analysis.vocalToolbox.volume],
              ] as const
            ).map(([label, item]) => (
              <li key={label} className="text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span>{label}</span>
                  <span className="font-mono text-xs text-muted">
                    {item.score}
                  </span>
                </div>
                <Bar score={item.score} />
                <p className="mt-1.5 text-xs text-muted">
                  {item.observation}{" "}
                  <span className="text-accent">{item.tip}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          {/* Rhetoric */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-1 font-display text-lg">Rhetoric</h3>
            <p className="mb-4 text-xs text-muted">
              Aristotle&apos;s appeals in your content
            </p>
            <ul className="space-y-3">
              {(
                [
                  ["Ethos · credibility", analysis.rhetoric.ethos],
                  ["Pathos · emotion", analysis.rhetoric.pathos],
                  ["Logos · logic", analysis.rhetoric.logos],
                ] as const
              ).map(([label, s]) => (
                <li key={label} className="text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="font-mono text-xs text-muted">
                      {s.score}
                    </span>
                  </div>
                  <Bar score={s.score} />
                  <p className="mt-1 text-xs text-muted">{s.comment}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Fillers */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-3 font-display text-lg">Filler words</h3>
            <div className="flex items-baseline gap-6">
              <div>
                <p className="font-mono text-2xl">{analysis.fillerWords.count}</p>
                <p className="text-xs text-muted">total</p>
              </div>
              <div>
                <p className="font-mono text-2xl">
                  {analysis.fillerWords.perMinute.toFixed(1)}
                </p>
                <p className="text-xs text-muted">per minute</p>
              </div>
            </div>
            {analysis.fillerWords.examples.length > 0 && (
              <p className="mt-3 text-xs italic text-muted">
                {analysis.fillerWords.examples
                  .slice(0, 4)
                  .map((e) => `"${e}"`)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Say it better — original vs improved verbiage */}
      {analysis.rewrites.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-1 font-display text-lg">Say it better</h3>
          <p className="mb-5 text-xs text-muted">
            The same message, articulated the way a strong speaker would
            deliver it. [pause] marks a deliberate silence.
          </p>
          <div className="space-y-5">
            {analysis.rewrites.map((r, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface-raised/50 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                    What you said
                  </p>
                  <p className="text-[15px] leading-relaxed text-muted">
                    &ldquo;{r.original}&rdquo;
                  </p>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-accent">
                    What you could have said
                  </p>
                  <p className="text-[15px] leading-relaxed">
                    &ldquo;{r.improved}&rdquo;
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-muted md:col-span-2">
                  <span className="text-accent">Why it works:</span> {r.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & improvements */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-3 font-display text-lg">What worked</h3>
          <ul className="space-y-2.5 text-[15px] leading-relaxed text-muted">
            {analysis.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-ok">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-3 font-display text-lg">Work on next</h3>
          <ul className="space-y-2.5 text-[15px] leading-relaxed text-muted">
            {analysis.improvements.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-record">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lessons */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="mb-4 font-display text-lg">Recommended practice</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {analysis.recommendedLessons.map((l) => {
            const lesson = findLessonByFocus(l.focus) ?? findLessonByFocus(l.title);
            return (
              <div
                key={l.title}
                className="flex flex-col rounded-xl border border-line bg-surface-raised/50 p-4"
              >
                <p className="text-xs uppercase tracking-wider text-accent">
                  {l.focus}
                </p>
                <p className="mt-1 text-sm font-medium">{l.title}</p>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                  {l.description}
                </p>
                {lesson && (
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className="mt-3 inline-block text-xs font-medium text-accent transition hover:brightness-110"
                  >
                    Open lesson: {lesson.title} →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
