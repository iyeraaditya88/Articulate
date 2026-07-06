"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SessionRecord } from "@/lib/audio/types";
import { loadSessions } from "@/lib/sessions";
import { RADAR_AXES } from "@/lib/analysis/types";
import { LESSONS } from "@/lib/lessons/content";
import {
  bestScore,
  loadLessonProgress,
  type LessonProgress,
} from "@/lib/lessons/progress";
import { RadarChart } from "@/components/charts/RadarChart";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Simple SVG line/area chart of overall scores over time. */
function ScoreTrend({ sessions }: { sessions: SessionRecord[] }) {
  const scored = sessions
    .filter((s) => s.analysis)
    .slice()
    .reverse(); // chronological
  if (scored.length < 2) return null;

  const w = 640;
  const h = 180;
  const padX = 14;
  const padY = 18;
  const xs = scored.map(
    (_, i) => padX + (i / (scored.length - 1)) * (w - padX * 2),
  );
  const ys = scored.map(
    (s) => h - padY - ((s.analysis!.overallScore / 100) * (h - padY * 2)),
  );
  const line = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${padX},${h - padY} ${line} ${xs[xs.length - 1].toFixed(1)},${h - padY}`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h3 className="mb-1 font-display text-lg">Overall score over time</h3>
      <p className="mb-4 text-xs text-muted">
        {scored.length} analyzed sessions · latest{" "}
        {scored[scored.length - 1].analysis!.overallScore}
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="min-w-[420px] w-full">
          {[25, 50, 75].map((v) => {
            const y = h - padY - (v / 100) * (h - padY * 2);
            return (
              <g key={v}>
                <line
                  x1={padX}
                  x2={w - padX}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.7"
                />
                <text
                  x={w - padX}
                  y={y - 4}
                  textAnchor="end"
                  className="fill-[var(--muted)] text-[10px]"
                >
                  {v}
                </text>
              </g>
            );
          })}
          <polygon points={area} fill="var(--accent)" fillOpacity="0.10" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {xs.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={ys[i]} r="3.5" fill="var(--accent)" />
              <text
                x={x}
                y={h - 4}
                textAnchor="middle"
                className="fill-[var(--muted)] text-[10px]"
              >
                {formatShortDate(scored[i].date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function RadarEvolution({ sessions }: { sessions: SessionRecord[] }) {
  const scored = sessions.filter((s) => s.analysis);
  if (scored.length === 0) return null;
  const latest = scored[0];
  const first = scored[scored.length - 1];
  const latestValues = RADAR_AXES.map((a) =>
    Math.round(latest.analysis!.radar[a.key].score),
  );
  const firstValues =
    scored.length > 1
      ? RADAR_AXES.map((a) => Math.round(first.analysis!.radar[a.key].score))
      : undefined;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h3 className="mb-1 font-display text-lg">Skill web evolution</h3>
      <p className="mb-2 text-xs text-muted">
        {firstValues ? (
          <>
            <span className="text-accent">— latest</span> vs{" "}
            <span>- - first analyzed session</span> (
            {formatShortDate(first.date)})
          </>
        ) : (
          "Your latest speaker profile — analyze more sessions to see growth."
        )}
      </p>
      <RadarChart
        labels={RADAR_AXES.map((a) => a.label)}
        values={latestValues}
        compareValues={firstValues}
      />
    </div>
  );
}

function LessonProgressCard({ progress }: { progress: LessonProgress }) {
  const practiced = LESSONS.filter((l) => (progress[l.slug] ?? []).length > 0);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg">Lesson progress</h3>
        <span className="text-xs text-muted">
          {practiced.length}/{LESSONS.length} practiced
        </span>
      </div>
      {practiced.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-muted">
          No lesson attempts yet —{" "}
          <Link href="/lessons" className="text-accent hover:brightness-110">
            open the lesson library
          </Link>{" "}
          and record your first practice answer.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {LESSONS.map((l) => {
            const attempts = progress[l.slug] ?? [];
            const best = bestScore(attempts);
            return (
              <li key={l.slug}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={`/lessons/${l.slug}`}
                    className="truncate transition hover:text-accent"
                  >
                    {l.title}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {best !== null
                      ? `best ${best} · ${attempts.length}×`
                      : "—"}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${best ?? 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ProgressDashboard() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress>({});

  useEffect(() => {
    setSessions(loadSessions());
    setLessonProgress(loadLessonProgress());
  }, []);

  if (sessions === null) {
    return <p className="text-sm text-muted">Loading progress…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
        <p className="font-display text-lg">No sessions yet</p>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
          Head to the Trial Room, record your first session, and it will show
          up here with your vocal metrics.
        </p>
        <Link
          href="/practice"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition hover:brightness-110"
        >
          Go to the Trial Room
        </Link>
      </div>
    );
  }

  const analyzed = sessions.filter((s) => s.analysis);
  const totalMin = sessions.reduce((a, s) => a + s.durationMs, 0) / 60000;
  const best = analyzed.length
    ? Math.max(...analyzed.map((s) => s.analysis!.overallScore))
    : null;
  const lessonAttemptCount = Object.values(lessonProgress).reduce(
    (a, arr) => a + arr.length,
    0,
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Sessions" value={String(sessions.length)} />
        <StatCard
          label="Practice time"
          value={`${totalMin.toFixed(0)}m`}
          hint="recorded speech"
        />
        <StatCard
          label="Best score"
          value={best !== null ? String(best) : "—"}
          hint={analyzed.length ? `${analyzed.length} analyzed` : "analyze a session"}
        />
        <StatCard
          label="Lesson reps"
          value={String(lessonAttemptCount)}
          hint="practice answers"
        />
      </div>

      <ScoreTrend sessions={sessions} />

      <div className="grid gap-5 lg:grid-cols-2">
        <RadarEvolution sessions={sessions} />
        <LessonProgressCard progress={lessonProgress} />
      </div>

      {/* Session history */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="mb-4 font-display text-lg">Session history</h3>
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised/50 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm">{formatDate(s.date)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {(s.durationMs / 1000).toFixed(0)}s ·{" "}
                  {s.metrics.pauses.count} pauses · ~
                  {s.metrics.pace.estWordsPerMin.toFixed(0)} wpm
                  {s.analysis ? ` · ${s.analysis.speakerType}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {s.analysis ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-soft font-mono text-xs text-accent">
                    {s.analysis.overallScore}
                  </span>
                ) : (
                  <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                    not analyzed
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    s.metrics.pitch.isMonotone
                      ? "bg-record/10 text-record"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  {s.metrics.pitch.isMonotone ? "Monotone" : "Varied"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
