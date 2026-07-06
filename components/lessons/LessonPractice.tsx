"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/lib/lessons/content";
import type { LessonFeedback } from "@/lib/lessons/feedback";
import type { TranscriptionResult } from "@/lib/analysis/types";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import {
  loadLessonProgress,
  recordLessonAttempt,
  type LessonAttempt,
} from "@/lib/lessons/progress";
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

export function LessonPractice({ lesson }: { lesson: Lesson }) {
  const analyzer = useAudioAnalyzer();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<LessonFeedback | null>(null);
  const [attempts, setAttempts] = useState<LessonAttempt[]>([]);

  useEffect(() => {
    setAttempts(loadLessonProgress()[lesson.slug] ?? []);
  }, [lesson.slug]);

  const question = lesson.questions[questionIdx];

  const resetFeedback = () => {
    setStage("idle");
    setError(null);
    setFeedback(null);
  };

  const nextQuestion = () => {
    resetFeedback();
    analyzer.reset();
    setQuestionIdx((i) => (i + 1) % lesson.questions.length);
  };

  const handleGetFeedback = async () => {
    if (!analyzer.audioBlob || !analyzer.metrics) return;
    setError(null);
    setStage("transcribing");
    try {
      const form = new FormData();
      form.append(
        "audio",
        new File([analyzer.audioBlob], "attempt", {
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
      const fRes = await fetch("/api/lesson-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonSlug: lesson.slug,
          question,
          transcription,
          metrics: analyzer.metrics,
        }),
      });
      if (!fRes.ok) throw new Error(await readError(fRes));
      const { feedback: result } = (await fRes.json()) as {
        feedback: LessonFeedback;
      };

      setFeedback(result);
      setStage("done");
      const attempt: LessonAttempt = {
        date: new Date().toISOString(),
        question,
        score: result.score,
      };
      recordLessonAttempt(lesson.slug, attempt);
      setAttempts((prev) => [attempt, ...prev]);
    } catch (e) {
      setStage("error");
      setError(
        e instanceof Error ? e.message : "Feedback failed. Please try again.",
      );
    }
  };

  return (
    <div className="rounded-2xl border border-accent/25 bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg">Practice set</h2>
        {attempts.length > 0 && (
          <p className="text-xs text-muted">
            Best score:{" "}
            <span className="font-mono text-accent">
              {Math.max(...attempts.map((a) => a.score))}
            </span>{" "}
            · {attempts.length} attempt{attempts.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <p className="mb-5 text-xs text-muted">
        Answer out loud, then get feedback on how well you applied this
        lesson&apos;s technique. Feedback takes ~30 seconds.
      </p>

      {/* Question card */}
      <div className="mb-5 rounded-xl border border-line bg-surface-raised/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Question {questionIdx + 1} of {lesson.questions.length}
            </p>
            <p className="mt-2 text-[17px] leading-relaxed">{question}</p>
          </div>
          <button
            onClick={nextQuestion}
            disabled={analyzer.status === "recording"}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:border-accent hover:text-foreground disabled:opacity-40"
          >
            Try another
          </button>
        </div>
      </div>

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
                ? "Evaluating your technique…"
                : "Get lesson feedback"}
          </button>
          {stage === "error" && error && (
            <p className="text-sm text-record">{error}</p>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && stage === "done" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-accent bg-accent-soft font-mono text-lg text-accent">
              {feedback.score}
            </span>
            <p className="font-display text-base leading-snug">
              {feedback.verdict}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface-raised/50 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-ok">
                Technique applied
              </p>
              <ul className="space-y-1.5 text-sm text-muted">
                {feedback.applied.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="text-ok">+</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface-raised/50 p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-record">
                Where it slipped
              </p>
              <ul className="space-y-1.5 text-sm text-muted">
                {feedback.missed.length === 0 ? (
                  <li>Nothing major — keep going.</li>
                ) : (
                  feedback.missed.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="text-record">→</span>
                      {m}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent-soft p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-accent">
              Hear the technique
            </p>
            <p className="text-[15px] leading-relaxed">
              &ldquo;{feedback.exampleLine}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-raised/50 p-4">
            <p className="text-sm text-muted">
              <span className="text-accent">Next attempt:</span>{" "}
              {feedback.nextStep}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetFeedback();
                  analyzer.reset();
                }}
                className="rounded-full bg-accent px-5 py-2 text-xs font-medium text-background transition hover:brightness-110"
              >
                Try again
              </button>
              <button
                onClick={nextQuestion}
                className="rounded-full border border-line px-5 py-2 text-xs text-muted transition hover:border-accent hover:text-foreground"
              >
                Next question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
