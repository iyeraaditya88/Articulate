export interface LessonAttempt {
  date: string;
  question: string;
  /** 0–100 how well the lesson technique was applied */
  score: number;
}

export type LessonProgress = Record<string, LessonAttempt[]>;

const KEY = "articulate.lessons.v1";

export function loadLessonProgress(): LessonProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function recordLessonAttempt(
  slug: string,
  attempt: LessonAttempt,
): void {
  const all = loadLessonProgress();
  all[slug] = [attempt, ...(all[slug] ?? [])].slice(0, 25);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // best-effort
  }
}

export function bestScore(attempts: LessonAttempt[] | undefined): number | null {
  if (!attempts || attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}
