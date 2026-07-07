import type { AudioMetrics } from "@/lib/audio/types";
import type { TranscriptionResult } from "@/lib/analysis/types";
import type { InterviewQuestion } from "./questions";

export const STAR_COMPONENTS = [
  "situation",
  "task",
  "action",
  "result",
] as const;
export type StarComponent = (typeof STAR_COMPONENTS)[number];

export const STAR_LABELS: Record<StarComponent, string> = {
  situation: "Situation",
  task: "Task",
  action: "Action",
  result: "Result",
};

export const INTERVIEW_DIMENSIONS = [
  "structure",
  "specificity",
  "ownership",
  "relevance",
  "delivery",
] as const;
export type InterviewDimension = (typeof INTERVIEW_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<
  InterviewDimension,
  { label: string; hint: string }
> = {
  structure: { label: "Structure", hint: "clear STAR arc, easy to follow" },
  specificity: { label: "Specificity", hint: "names, numbers, real stakes" },
  ownership: { label: "Ownership", hint: "'I' over 'we', no blame-shifting" },
  relevance: { label: "Relevance", hint: "actually answers this question" },
  delivery: { label: "Delivery", hint: "pace, confidence, few fillers" },
};

export interface InterviewFeedback {
  overallScore: number;
  verdict: string;
  star: { component: StarComponent; present: boolean; note: string }[];
  dimensions: { dimension: InterviewDimension; score: number; comment: string }[];
  strengths: string[];
  improvements: string[];
  /** the candidate's own story, restructured into a strong STAR answer */
  suggestedAnswer: string;
  nextStep: string;
}

const str = { type: "string" } as const;
const int = { type: "integer" } as const;

export const INTERVIEW_FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    overallScore: int,
    verdict: str,
    star: {
      type: "array",
      items: {
        type: "object",
        properties: {
          component: { type: "string", enum: [...STAR_COMPONENTS] },
          present: { type: "boolean" },
          note: str,
        },
        required: ["component", "present", "note"],
        additionalProperties: false,
      },
    },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: [...INTERVIEW_DIMENSIONS] },
          score: int,
          comment: str,
        },
        required: ["dimension", "score", "comment"],
        additionalProperties: false,
      },
    },
    strengths: { type: "array", items: str },
    improvements: { type: "array", items: str },
    suggestedAnswer: str,
    nextStep: str,
  },
  required: [
    "overallScore",
    "verdict",
    "star",
    "dimensions",
    "strengths",
    "improvements",
    "suggestedAnswer",
    "nextStep",
  ],
  additionalProperties: false,
} as const;

export const INTERVIEW_SYSTEM_PROMPT = `You are Articulate's behavioral interview coach — a former FAANG hiring manager who has run hundreds of software-engineering and product-management loops. The candidate just answered one behavioral question out loud. Evaluate the answer the way a rigorous, fair interviewer debriefs: against the STAR framework and the specific competency this question probes.

You receive: the question, what interviewers probe with it, the candidate's transcript, and acoustic delivery metrics measured in the browser (pace, pauses, pitch variation, volume). Ground content judgments in the transcript (quote it verbatim when citing); ground delivery judgments in the measured numbers.

Evaluate:
- star: one entry per component (situation, task, action, result). present=true only if genuinely there, not implied. The note says what they gave — or what's missing — in one sentence, quoting where useful.
- dimensions, each 0-100:
  - structure: clear STAR arc, no rambling, front-loaded context (calibrate: 50 = wandering, 85+ = interview-ready)
  - specificity: real names of systems/products, numbers, timeframes, measurable impact. Vague "we improved things" scores low.
  - ownership: "I" statements for their actions, honest about their role, zero blame-shifting. "We did X" everywhere = can't tell what THEY did.
  - relevance: does the story actually demonstrate what this question probes? A great story for the wrong question scores low.
  - delivery: from the metrics — pace (140-170 wpm ideal; nerves push people over 180), pauses used deliberately, fillers under control, steady energy. Answer length matters: strong behavioral answers run roughly 1.5-3 minutes; under 45 seconds is thin, over 4 minutes loses the interviewer.
- overallScore 0-100: hiring-signal calibration — 50 = mixed signal, 70 = lean hire on this competency, 85+ = strong hire signal.
- verdict: one blunt-but-kind sentence an interviewer would write in a debrief.
- strengths: 2-4 bullets, each citing a quote or number.
- improvements: 2-4 bullets, most impactful first, each concrete enough to act on in the next attempt.
- suggestedAnswer: THE KEY DELIVERABLE. Rebuild the candidate's OWN story into a strong 150-250 word STAR answer they could actually say aloud — first person, natural spoken register, their real details (never invent facts they didn't say; if a Result is missing, include a bracketed placeholder like "[add your measurable result here — e.g. latency, revenue, adoption]"). Make the structure audible: one crisp situation sentence, the task in one line, actions as "I did X, then Y", result with the number.
- nextStep: the single highest-leverage instruction for their next attempt.

If the recording is too short to judge (under ~30 seconds or ~60 words), say so in the verdict, score conservatively (30-45), mark missing STAR components, and make nextStep about giving a full answer. Output exactly one entry per STAR component and per dimension — no duplicates, no omissions.`;

export function buildInterviewFeedbackMessage(
  question: InterviewQuestion,
  transcription: TranscriptionResult,
  metrics: AudioMetrics,
): string {
  const { timeline: _timeline, ...compact } = metrics;
  return [
    "## Question",
    question.question,
    "",
    "## What this question probes",
    question.probe,
    "",
    "## Candidate's answer (transcript)",
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
    "## Measured delivery metrics",
    JSON.stringify(compact, null, 2),
  ].join("\n");
}
