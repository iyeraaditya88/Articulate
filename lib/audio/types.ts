export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "stopped"
  | "error";

/** One analysis frame captured by the 50 ms loop. Timestamps are real
 * (performance.now-based) — never assume a fixed cadence when aggregating. */
export interface AnalysisFrame {
  /** ms since recording start */
  t: number;
  rms: number;
  db: number;
  peak: number;
  pitchHz: number | null;
  clarity: number;
  isSpeaking: boolean;
}

/** Throttled (~10 Hz) snapshot consumed by live UI meters. */
export interface LiveAudioState {
  status: RecorderStatus;
  elapsedMs: number;
  pitchHz: number | null;
  pitchClarity: number;
  rms: number;
  db: number;
  isSpeaking: boolean;
  isClipping: boolean;
  pauseCount: number;
}

export interface PitchMetrics {
  meanHz: number;
  medianHz: number;
  /** SD of voiced frames in semitones vs session median — the monotone metric */
  stdDevSemitones: number;
  /** p95 − p5 in semitones (robust range) */
  rangeSemitones: number;
  minHz: number;
  maxHz: number;
  /** voiced frames / speaking frames */
  voicedRatio: number;
  isMonotone: boolean;
}

export interface VolumeMetrics {
  meanDb: number;
  /** dynamics over speaking frames only */
  stdDevDb: number;
  clippedRatio: number;
  tooQuiet: boolean;
}

export interface PauseMetrics {
  /** interior silences > 300 ms */
  count: number;
  /** interior silences > 1000 ms */
  longCount: number;
  meanMs: number;
  maxMs: number;
  totalMs: number;
  /** speakingMs / trimmed duration (leading/trailing silence excluded) */
  speakingRatio: number;
}

export interface PaceMetrics {
  estSyllablesPerMin: number;
  /** rough: syllables / 1.5 — replaced by true WPM once a transcript exists */
  estWordsPerMin: number;
  speechSegmentCount: number;
}

export interface MetricsTimeline {
  frameMs: number[];
  pitchHz: (number | null)[];
  db: number[];
}

/** Final per-session summary, computed once at stop(). This object is also
 * what gets sent to the LLM in Phase 3 and persisted for the Progress page. */
export interface AudioMetrics {
  durationMs: number;
  sampleRate: number;
  pitch: PitchMetrics;
  volume: VolumeMetrics;
  pauses: PauseMetrics;
  pace: PaceMetrics;
  timeline: MetricsTimeline;
}

/** Session record persisted to localStorage for the Progress Tracker. */
export interface SessionRecord {
  id: string;
  date: string;
  durationMs: number;
  metrics: AudioMetrics;
  transcript?: string;
  analysis?: import("@/lib/analysis/types").SpeechAnalysis;
}

export const LOCAL_STORAGE_SESSIONS_KEY = "articulate.sessions.v1";
