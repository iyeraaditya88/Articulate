import type { Track } from "./questions";

export interface InterviewAttempt {
  date: string;
  questionId: string;
  question: string;
  track: Track;
  score: number;
}

const KEY = "articulate.interview.v1";

export function loadInterviewAttempts(): InterviewAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordInterviewAttempt(attempt: InterviewAttempt): void {
  const all = [attempt, ...loadInterviewAttempts()].slice(0, 50);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // best-effort
  }
}
