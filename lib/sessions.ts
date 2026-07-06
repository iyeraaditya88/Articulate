import {
  LOCAL_STORAGE_SESSIONS_KEY,
  type AudioMetrics,
  type SessionRecord,
} from "@/lib/audio/types";

export function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function updateSession(
  id: string,
  patch: Partial<Pick<SessionRecord, "transcript" | "analysis">>,
): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx < 0) return;
  sessions[idx] = { ...sessions[idx], ...patch };
  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_SESSIONS_KEY,
      JSON.stringify(sessions),
    );
  } catch {
    // best-effort
  }
}

export function saveSession(metrics: AudioMetrics): SessionRecord {
  const record: SessionRecord = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    durationMs: metrics.durationMs,
    metrics,
  };
  const sessions = loadSessions();
  sessions.unshift(record);
  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_SESSIONS_KEY,
      JSON.stringify(sessions),
    );
  } catch {
    // Quota exceeded — drop the oldest sessions' timelines and retry once.
    const slimmed = sessions.map((s, i) =>
      i < 20
        ? s
        : {
            ...s,
            metrics: {
              ...s.metrics,
              timeline: { frameMs: [], pitchHz: [], db: [] },
            },
          },
    );
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_SESSIONS_KEY,
        JSON.stringify(slimmed),
      );
    } catch {
      // Still failing — persistence is best-effort.
    }
  }
  return record;
}
