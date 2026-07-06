import type { AudioMetrics } from "@/lib/audio/types";
import type { TranscriptionResult } from "@/lib/analysis/types";
import type { Lesson } from "./content";

export interface LessonFeedback {
  /** 0–100: how well the lesson's technique was applied */
  score: number;
  verdict: string;
  applied: string[];
  missed: string[];
  /** ideal 1-2 sentence example of applying the technique to THIS question */
  exampleLine: string;
  nextStep: string;
}

export const LESSON_FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    verdict: { type: "string" },
    applied: { type: "array", items: { type: "string" } },
    missed: { type: "array", items: { type: "string" } },
    exampleLine: { type: "string" },
    nextStep: { type: "string" },
  },
  required: ["score", "verdict", "applied", "missed", "exampleLine", "nextStep"],
  additionalProperties: false,
} as const;

export const LESSON_FEEDBACK_SYSTEM_PROMPT = `You are Articulate's lesson coach. The speaker just studied ONE specific speaking lesson and recorded an answer to a practice question. Your only job is to evaluate how well they APPLIED THAT LESSON'S TECHNIQUE — this is not a general speech review.

You receive the lesson (title, what it teaches, what to evaluate), the practice question, the transcript, and acoustic metrics measured in the browser (pitch stats in semitones, volume dB, pauses, pace). Ground acoustic judgments in the measured numbers; ground content judgments in the transcript; quote the transcript verbatim when citing evidence.

Output:
- score (integer 0-100): purely how well the lesson's technique was applied. 50 = no visible attempt, 70 = clear attempt with gaps, 85+ = technique genuinely working. Judge against the lesson's evaluationFocus.
- verdict: one punchy sentence summarizing the attempt.
- applied: 2-4 short bullets of what they did right RE: this technique, each citing a number or short quote.
- missed: 1-3 short bullets of where the technique slipped, each citing a number or short quote. Empty only if truly flawless.
- exampleLine: 1-2 sentences showing the technique applied perfectly to THIS question — verbiage they could actually say aloud, in a natural register. Use [pause] markers if the lesson involves pausing.
- nextStep: one concrete instruction for their next attempt (a single adjustment, not a list).

Be encouraging but precise — a coach, not a cheerleader. If the recording is too short (~under 15 seconds or 30 words) to judge, say so in the verdict, score conservatively around 40-50, and make nextStep "record a fuller attempt".`;

export function buildLessonFeedbackMessage(
  lesson: Lesson,
  question: string,
  transcription: TranscriptionResult,
  metrics: AudioMetrics,
): string {
  const { timeline: _timeline, ...compact } = metrics;
  return [
    "## Lesson",
    `Title: ${lesson.title}`,
    `Teaches: ${lesson.trains} — ${lesson.tagline}`,
    `Evaluation focus: ${lesson.evaluationFocus}`,
    "",
    "## Practice question",
    question,
    "",
    "## Transcript of the attempt",
    transcription.text.trim() || "(no speech detected)",
    "",
    "## Stats",
    JSON.stringify(
      {
        durationSec: Math.round(transcription.durationSec),
        wordCount: transcription.wordCount,
        wordsPerMin: Math.round(transcription.wordsPerMin),
      },
      null,
      2,
    ),
    "",
    "## Measured acoustic metrics",
    JSON.stringify(compact, null, 2),
  ].join("\n");
}
