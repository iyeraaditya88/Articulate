"use client";

import Link from "next/link";
import { useState } from "react";
import type { SpeechAnalysis } from "@/lib/analysis/types";
import {
  RADAR_AXES,
  SIN_LABELS,
  VOICE_TYPE_LABELS,
} from "@/lib/analysis/types";
import { RadarChart } from "@/components/charts/RadarChart";
import { findLessonByFocus } from "@/lib/lessons/content";

type Tab = "profile" | "delivery" | "content" | "coaching";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "delivery", label: "Delivery" },
  { id: "content", label: "Content" },
  { id: "coaching", label: "Coaching" },
];

function gradeTone(grade: string): string {
  if (grade === "A") return "text-ok";
  if (grade === "B") return "text-accent";
  return "text-record";
}

function scoreTone(score: number): string {
  if (score >= 70) return "text-ok";
  if (score >= 45) return "text-accent";
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h3 className="font-display text-lg">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Row with label, score, bar, and explanation — the repeated learning unit. */
function ScoredRow({
  label,
  score,
  text,
  tip,
}: {
  label: string;
  score: number;
  text: string;
  tip?: string;
}) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[15px]">{label}</span>
        <span className={`font-mono text-sm ${scoreTone(score)}`}>{score}</span>
      </div>
      <Bar score={score} />
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {text}
        {tip && <span className="text-accent"> {tip}</span>}
      </p>
    </li>
  );
}

export function AnalysisPanel({ analysis }: { analysis: SpeechAnalysis }) {
  const [tab, setTab] = useState<Tab>("profile");

  const radarValues = RADAR_AXES.map((a) =>
    Math.round(analysis.radar[a.key].score),
  );
  const detectedSins = SIN_LABELS.filter((s) => analysis.sins[s.key].detected);

  // Derived headline takeaways: strongest and weakest radar axes.
  const sorted = RADAR_AXES.map((a) => ({
    label: a.label,
    score: analysis.radar[a.key].score,
  })).sort((x, y) => y.score - x.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <section className="space-y-4">
      {/* ——— Hero: who you are as a speaker ——— */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
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
            <h2 className="mt-1.5 font-display text-xl leading-snug">
              {analysis.headline}
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-ok/25 bg-ok/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-ok">
              Biggest strength
            </p>
            <p className="mt-0.5 text-[15px]">
              {strongest.label}{" "}
              <span className="font-mono text-sm text-muted">
                {Math.round(strongest.score)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-record/25 bg-record/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-record">
              Focus area
            </p>
            <p className="mt-0.5 text-[15px]">
              {weakest.label}{" "}
              <span className="font-mono text-sm text-muted">
                {Math.round(weakest.score)}
              </span>
            </p>
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {analysis.summary}
        </p>
      </div>

      {/* ——— Tabs ——— */}
      <div className="sticky top-[57px] z-10 -mx-1 overflow-x-auto px-1 py-1 md:top-0 md:py-2">
        <div className="flex w-max min-w-full gap-1.5 rounded-full border border-line bg-surface p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent text-background"
                  : "text-foreground hover:bg-surface-raised"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ——— Profile: the skill web ——— */}
      {tab === "profile" && (
        <Section
          title="Your speaker profile"
          subtitle="Eight skills, scored 0–100 — the shape shows where you are today"
        >
          <RadarChart
            labels={RADAR_AXES.map((a) => a.label)}
            values={radarValues}
          />
          <ul className="mt-4 divide-y divide-line">
            {RADAR_AXES.map((a) => (
              <ScoredRow
                key={a.key}
                label={a.label}
                score={Math.round(analysis.radar[a.key].score)}
                text={analysis.radar[a.key].comment}
              />
            ))}
          </ul>
        </Section>
      )}

      {/* ——— Delivery: how you sounded ——— */}
      {tab === "delivery" && (
        <div className="space-y-4">
          <Section
            title="Vocal Toolbox"
            subtitle="Julian Treasure's six instruments, measured from your audio"
          >
            <ul className="divide-y divide-line">
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
                <ScoredRow
                  key={label}
                  label={label}
                  score={item.score}
                  text={item.observation}
                  tip={item.tip}
                />
              ))}
            </ul>
          </Section>

          <Section title="Filler words" subtitle="Ums, likes, and hedges">
            <div className="flex items-baseline gap-8">
              <div>
                <p className="font-mono text-3xl">
                  {analysis.fillerWords.count}
                </p>
                <p className="text-xs text-muted">total</p>
              </div>
              <div>
                <p className="font-mono text-3xl">
                  {analysis.fillerWords.perMinute.toFixed(1)}
                </p>
                <p className="text-xs text-muted">per minute</p>
              </div>
              <p className="flex-1 text-[13px] leading-relaxed text-muted">
                {analysis.fillerWords.perMinute <= 1
                  ? "Excellent — under one per minute."
                  : analysis.fillerWords.perMinute <= 3
                    ? "Acceptable range — under three per minute."
                    : "Above three per minute — listeners start hearing the fillers instead of the idea."}
              </p>
            </div>
            {analysis.fillerWords.examples.length > 0 && (
              <p className="mt-3 text-[13px] italic text-muted">
                {analysis.fillerWords.examples
                  .slice(0, 4)
                  .map((e) => `"${e}"`)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-3 text-[13px] text-muted">
              <span className="text-accent">Voice note:</span>{" "}
              {analysis.voice.description}
            </p>
          </Section>
        </div>
      )}

      {/* ——— Content: what you said ——— */}
      {tab === "content" && (
        <div className="space-y-4">
          <Section
            title="HAIL"
            subtitle="Honesty · Authenticity · Integrity · Love — the stance behind your words"
          >
            <ul className="divide-y divide-line">
              {(
                [
                  ["Honesty", analysis.hail.honesty],
                  ["Authenticity", analysis.hail.authenticity],
                  ["Integrity", analysis.hail.integrity],
                  ["Love", analysis.hail.love],
                ] as const
              ).map(([label, g]) => (
                <li key={label} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-raised font-mono text-base ${gradeTone(g.grade)}`}
                  >
                    {g.grade}
                  </span>
                  <div>
                    <p className="text-[15px]">{label}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                      {g.comment}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Seven Deadly Sins"
            subtitle={
              detectedSins.length === 0
                ? "Clean sheet — none detected in this recording"
                : `${detectedSins.length} detected — habits that make people tune out`
            }
          >
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SIN_LABELS.map((s) => {
                const finding = analysis.sins[s.key];
                return (
                  <li
                    key={s.key}
                    className={`rounded-lg border px-3 py-2.5 text-[13px] ${
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
          </Section>

          <Section
            title="Rhetoric"
            subtitle="Aristotle's three appeals — how persuasive the content was"
          >
            <ul className="divide-y divide-line">
              {(
                [
                  ["Ethos · credibility", analysis.rhetoric.ethos],
                  ["Pathos · emotion", analysis.rhetoric.pathos],
                  ["Logos · logic", analysis.rhetoric.logos],
                ] as const
              ).map(([label, s]) => (
                <ScoredRow
                  key={label}
                  label={label}
                  score={s.score}
                  text={s.comment}
                />
              ))}
            </ul>
          </Section>
        </div>
      )}

      {/* ——— Coaching: what to do about it ——— */}
      {tab === "coaching" && (
        <div className="space-y-4">
          {analysis.rewrites.length > 0 && (
            <Section
              title="Say it better"
              subtitle="Your words, rearticulated the way a strong speaker would deliver them — [pause] marks deliberate silence"
            >
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
                    <p className="text-[13px] leading-relaxed text-muted md:col-span-2">
                      <span className="text-accent">Why it works:</span>{" "}
                      {r.note}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="What worked">
              <ul className="space-y-2.5 text-[15px] leading-relaxed text-muted">
                {analysis.strengths.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="text-ok">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Work on next">
              <ul className="space-y-2.5 text-[15px] leading-relaxed text-muted">
                {analysis.improvements.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="text-record">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section
            title="Recommended practice"
            subtitle="Three exercises targeting your weakest areas — each links to a full lesson"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {analysis.recommendedLessons.map((l) => {
                const lesson =
                  findLessonByFocus(l.focus) ?? findLessonByFocus(l.title);
                return (
                  <div
                    key={l.title}
                    className="flex flex-col rounded-xl border border-line bg-surface-raised/50 p-4"
                  >
                    <p className="text-xs uppercase tracking-wider text-accent">
                      {l.focus}
                    </p>
                    <p className="mt-1 text-[15px] font-medium">{l.title}</p>
                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                      {l.description}
                    </p>
                    {lesson && (
                      <Link
                        href={`/lessons/${lesson.slug}`}
                        className="mt-3 inline-block text-[13px] font-medium text-accent transition hover:brightness-110"
                      >
                        Open lesson: {lesson.title} →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}
    </section>
  );
}
