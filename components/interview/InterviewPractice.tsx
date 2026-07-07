"use client";

import { useEffect, useMemo, useState } from "react";
import type { Track } from "@/lib/interview/questions";
import {
  TRACK_LABELS,
  questionsForTrack,
} from "@/lib/interview/questions";
import type { InterviewFeedback } from "@/lib/interview/feedback";
import {
  DIMENSION_LABELS,
  INTERVIEW_DIMENSIONS,
  STAR_COMPONENTS,
  STAR_LABELS,
} from "@/lib/interview/feedback";
import type { TranscriptionResult } from "@/lib/analysis/types";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import {
  loadInterviewAttempts,
  recordInterviewAttempt,
  type InterviewAttempt,
} from "@/lib/interview/progress";
import { RecordingControls } from "@/components/practice/RecordingControls";
import { LiveMeters } from "@/components/practice/LiveMeters";

type Stage = "idle" | "transcribing" | "analyzing" | "done" | "error";

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // fall through
  }
  return "Something went wrong. Please try again.";
}

function scoreTone(score: number): string {
  if (score >= 70) return "text-ok";
  if (score >= 45) return "text-accent";
  return "text-record";
}

export function InterviewPractice() {
  const analyzer = useAudioAnalyzer();
  const [track, setTrack] = useState<Track>("swe");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);

  useEffect(() => {
    setAttempts(loadInterviewAttempts());
  }, []);

  const questions = useMemo(() => questionsForTrack(track), [track]);
  const question = questions[questionIdx % questions.length];

  const resetFeedback = () => {
    setStage("idle");
    setError(null);
    setFeedback(null);
  };

  const switchTrack = (t: Track) => {
    if (analyzer.status === "recording") return;
    setTrack(t);
    setQuestionIdx(0);
    setShowHint(false);
    resetFeedback();
    analyzer.reset();
  };

  const nextQuestion = () => {
    resetFeedback();
    setShowHint(false);
    analyzer.reset();
    setQuestionIdx((i) => (i + 1) % questions.length);
  };

  const handleGetFeedback = async () => {
    if (!analyzer.audioBlob || !analyzer.metrics) return;
    setError(null);
    setStage("transcribing");
    try {
      const form = new FormData();
      form.append(
        "audio",
        new File([analyzer.audioBlob], "answer", {
          type: analyzer.audioMimeType ?? "audio/webm",
        }),
      );
      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      if (!tRes.ok) throw new Error(await readError(tRes));
      const transcription = (await tRes.json()) as TranscriptionResult;

      setStage("analyzing");
      const fRes = await fetch("/api/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          transcription,
          metrics: analyzer.metrics,
        }),
      });
      if (!fRes.ok) throw new Error(await readError(fRes));
      const { feedback: result } = (await fRes.json()) as {
        feedback: InterviewFeedback;
      };

      setFeedback(result);
      setStage("done");
      const attempt: InterviewAttempt = {
        date: new Date().toISOString(),
        questionId: question.id,
        question: question.question,
        track,
        score: result.overallScore,
      };
      recordInterviewAttempt(attempt);
      setAttempts((prev) => [attempt, ...prev]);
    } catch (e) {
      setStage("error");
      setError(
        e instanceof Error ? e.message : "Feedback failed. Please try again.",
      );
    }
  };

  const starByKey = (c: string) =>
    feedback?.star.find((s) => s.component === c);
  const dimByKey = (d: string) =>
    feedback?.dimensions.find((x) => x.dimension === d);

  return (
    <div className="space-y-5">
      {/* Track selector */}
      <div className="flex gap-1.5 rounded-full border border-line bg-surface p-1.5">
        {(Object.keys(TRACK_LABELS) as Track[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTrack(t)}
            disabled={analyzer.status === "recording"}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              track === t
                ? "bg-accent text-background"
                : "text-foreground hover:bg-surface-raised"
            }`}
          >
            {TRACK_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-accent/25 bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-accent">
              {question.category} · question {(questionIdx % questions.length) + 1} of{" "}
              {questions.length}
            </p>
            <p className="mt-2 text-[17px] leading-relaxed">
              {question.question}
            </p>
          </div>
          <button
            onClick={nextQuestion}
            disabled={analyzer.status === "recording"}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:border-accent hover:text-foreground disabled:opacity-40"
          >
            Next question
          </button>
        </div>

        <button
          onClick={() => setShowHint((h) => !h)}
          className="mt-3 text-xs font-medium text-accent transition hover:brightness-110"
        >
          {showHint ? "Hide" : "What is the interviewer really asking?"}
        </button>
        {showHint && (
          <p className="mt-2 rounded-xl border border-line bg-surface-raised/50 p-3.5 text-[13px] leading-relaxed text-muted">
            {question.probe}
          </p>
        )}

        <p className="mt-4 text-xs text-muted">
          Aim for <span className="text-foreground">1.5–3 minutes</span> using
          STAR: the Situation, your Task, the Actions{" "}
          <span className="text-foreground">you</span> took, and a measurable
          Result.
        </p>

        <div className="mt-5">
          <RecordingControls
            status={analyzer.status}
            isSupported={analyzer.isSupported}
            error={analyzer.error}
            elapsedMs={analyzer.live.elapsedMs}
            onStart={() => {
              resetFeedback();
              void analyzer.start();
            }}
            onStop={() => void analyzer.stop()}
            onReset={() => {
              resetFeedback();
              analyzer.reset();
            }}
          />
        </div>

        {analyzer.status === "recording" && (
          <div className="mt-5">
            <LiveMeters live={analyzer.live} />
          </div>
        )}

        {analyzer.status === "stopped" && stage !== "done" && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              onClick={() => void handleGetFeedback()}
              disabled={stage === "transcribing" || stage === "analyzing"}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {(stage === "transcribing" || stage === "analyzing") && (
                <span className="size-3 animate-spin rounded-full border-2 border-background/40 border-t-background" />
              )}
              {stage === "transcribing"
                ? "Transcribing…"
                : stage === "analyzing"
                  ? "Interviewer is deliberating…"
                  : "Get interviewer feedback"}
            </button>
            {stage === "error" && error && (
              <p className="text-sm text-record">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && stage === "done" && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <span
                className={`grid size-16 shrink-0 place-items-center rounded-full border-2 font-mono text-xl ${
                  feedback.overallScore >= 70
                    ? "border-ok text-ok"
                    : feedback.overallScore >= 45
                      ? "border-accent text-accent"
                      : "border-record text-record"
                }`}
              >
                {feedback.overallScore}
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">
                  Interviewer debrief
                </p>
                <p className="mt-1 font-display text-lg leading-snug">
                  {feedback.verdict}
                </p>
              </div>
            </div>

            {/* STAR checklist */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {STAR_COMPONENTS.map((c) => {
                const item = starByKey(c);
                const present = item?.present ?? false;
                return (
                  <div
                    key={c}
                    className={`rounded-xl border p-3.5 ${
                      present
                        ? "border-ok/30 bg-ok/5"
                        : "border-record/30 bg-record/5"
                    }`}
                  >
                    <p className="flex items-center justify-between text-sm font-medium">
                      {STAR_LABELS[c]}
                      <span className={present ? "text-ok" : "text-record"}>
                        {present ? "✓" : "✗"}
                      </span>
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                      {item?.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimensions */}
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg">Hiring-signal scores</h3>
            <ul className="divide-y divide-line">
              {INTERVIEW_DIMENSIONS.map((d) => {
                const item = dimByKey(d);
                if (!item) return null;
                const meta = DIMENSION_LABELS[d];
                return (
                  <li key={d} className="py-3 first:pt-0 last:pb-0">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="text-[15px]">
                        {meta.label}{" "}
                        <span className="text-xs text-muted">
                          · {meta.hint}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-sm ${scoreTone(item.score)}`}
                      >
                        {item.score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.max(2, Math.min(item.score, 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                      {item.comment}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Strengths / improvements */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-ok">
                What landed
              </p>
              <ul className="space-y-2.5 text-[14px] leading-relaxed text-muted">
                {feedback.strengths.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="text-ok">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-record">
                What would worry an interviewer
              </p>
              <ul className="space-y-2.5 text-[14px] leading-relaxed text-muted">
                {feedback.improvements.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="text-record">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested answer */}
          <div className="rounded-2xl border border-accent/30 bg-accent-soft p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-accent">
              Your story, told the strong way
            </p>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">
              {feedback.suggestedAnswer}
            </p>
            <p className="mt-4 rounded-xl border border-line bg-surface/60 p-3.5 text-[13px] leading-relaxed text-muted">
              <span className="text-accent">Next attempt:</span>{" "}
              {feedback.nextStep}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  resetFeedback();
                  analyzer.reset();
                }}
                className="rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-background transition hover:brightness-110"
              >
                Retry this question
              </button>
              <button
                onClick={nextQuestion}
                className="rounded-full border border-line px-5 py-2.5 text-xs text-muted transition hover:border-accent hover:text-foreground"
              >
                Next question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent attempts */}
      {attempts.length > 0 && stage !== "done" && (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-lg">Recent answers</h3>
          <ul className="space-y-2.5">
            {attempts.slice(0, 5).map((a, i) => (
              <li
                key={`${a.date}-${i}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-muted">
                  {a.question}
                </span>
                <span
                  className={`shrink-0 font-mono text-xs ${scoreTone(a.score)}`}
                >
                  {a.score}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
