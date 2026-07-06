import type {
  AnalysisFrame,
  AudioMetrics,
  MetricsTimeline,
  PaceMetrics,
  PauseMetrics,
  PitchMetrics,
  VolumeMetrics,
} from "./types";
import type { PauseSpan } from "./pauses";
import { CLIP_PEAK, TOO_QUIET_DB } from "./volume";

export const MONOTONE_SEMITONE_SD = 1.5;
const LONG_PAUSE_MS = 1000;
const TIMELINE_MAX_POINTS = 300;

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) * (x - m))));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(sorted.length * p)),
  );
  return sorted[idx];
}

function hzToSemitones(hz: number, refHz: number): number {
  return 12 * Math.log2(hz / refHz);
}

function computePitchMetrics(frames: AnalysisFrame[]): PitchMetrics {
  const speaking = frames.filter((f) => f.isSpeaking);
  const voiced = speaking.filter((f) => f.pitchHz !== null);
  const hzs = voiced.map((f) => f.pitchHz as number).sort((a, b) => a - b);

  if (hzs.length === 0) {
    return {
      meanHz: 0,
      medianHz: 0,
      stdDevSemitones: 0,
      rangeSemitones: 0,
      minHz: 0,
      maxHz: 0,
      voicedRatio: 0,
      isMonotone: true,
    };
  }

  const medianHz = percentile(hzs, 0.5);
  const st = hzs.map((hz) => hzToSemitones(hz, medianHz));
  const stSorted = st.slice().sort((a, b) => a - b);
  const stdDevSemitones = stdDev(st);

  return {
    meanHz: mean(hzs),
    medianHz,
    stdDevSemitones,
    rangeSemitones: percentile(stSorted, 0.95) - percentile(stSorted, 0.05),
    minHz: hzs[0],
    maxHz: hzs[hzs.length - 1],
    voicedRatio: speaking.length > 0 ? voiced.length / speaking.length : 0,
    isMonotone: stdDevSemitones < MONOTONE_SEMITONE_SD,
  };
}

function computeVolumeMetrics(frames: AnalysisFrame[]): VolumeMetrics {
  const speakingDb = frames.filter((f) => f.isSpeaking).map((f) => f.db);
  const clipped = frames.filter((f) => f.peak > CLIP_PEAK).length;
  const meanDb = mean(speakingDb);
  return {
    meanDb,
    stdDevDb: stdDev(speakingDb),
    clippedRatio: frames.length > 0 ? clipped / frames.length : 0,
    tooQuiet: speakingDb.length > 0 && meanDb < TOO_QUIET_DB,
  };
}

function computePauseMetrics(
  pauses: PauseSpan[],
  firstSpeechAt: number | null,
  lastSpeechAt: number | null,
  frames: AnalysisFrame[],
): PauseMetrics {
  const lengths = pauses.map((p) => p.endMs - p.startMs);
  const trimmedMs =
    firstSpeechAt !== null && lastSpeechAt !== null
      ? Math.max(lastSpeechAt - firstSpeechAt, 1)
      : 1;

  // Approximate speaking time by integrating frame gaps flagged as speech,
  // using real timestamps (the loop cadence degrades on hidden tabs).
  let speakingMs = 0;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].isSpeaking) speakingMs += frames[i].t - frames[i - 1].t;
  }

  return {
    count: pauses.length,
    longCount: lengths.filter((l) => l > LONG_PAUSE_MS).length,
    meanMs: mean(lengths),
    maxMs: lengths.length > 0 ? Math.max(...lengths) : 0,
    totalMs: lengths.reduce((a, b) => a + b, 0),
    speakingRatio: Math.min(speakingMs / trimmedMs, 1),
  };
}

/**
 * Rough pace estimate from syllable nuclei: local maxima of the smoothed RMS
 * envelope within speech, with prominence over neighboring troughs and a
 * minimum peak spacing. Refined to true WPM by the transcript in Phase 3.
 */
function computePaceMetrics(frames: AnalysisFrame[]): PaceMetrics {
  const MIN_PEAK_SPACING_MS = 120;
  const PROMINENCE = 1.5;

  // Smooth RMS over a 3-frame window.
  const smoothed = frames.map((f, i) => {
    const a = frames[Math.max(0, i - 1)].rms;
    const b = f.rms;
    const c = frames[Math.min(frames.length - 1, i + 1)].rms;
    return (a + b + c) / 3;
  });

  let syllables = 0;
  let lastPeakT = -Infinity;
  let segments = 0;
  let speakingMs = 0;
  let prevSpeaking = false;

  for (let i = 1; i < frames.length - 1; i++) {
    const f = frames[i];
    if (f.isSpeaking && !prevSpeaking) segments++;
    if (f.isSpeaking) speakingMs += f.t - frames[i - 1].t;
    prevSpeaking = f.isSpeaking;

    if (!f.isSpeaking) continue;
    const isPeak = smoothed[i] > smoothed[i - 1] && smoothed[i] >= smoothed[i + 1];
    if (!isPeak) continue;
    if (f.t - lastPeakT < MIN_PEAK_SPACING_MS) continue;

    // Find nearest troughs on both sides for the prominence check.
    let leftTrough = smoothed[i];
    for (let j = i - 1; j >= 0 && frames[j].isSpeaking; j--) {
      if (smoothed[j] < leftTrough) leftTrough = smoothed[j];
      if (smoothed[j] > smoothed[i]) break;
    }
    let rightTrough = smoothed[i];
    for (let j = i + 1; j < frames.length && frames[j].isSpeaking; j++) {
      if (smoothed[j] < rightTrough) rightTrough = smoothed[j];
      if (smoothed[j] > smoothed[i]) break;
    }
    const ref = Math.max(leftTrough, rightTrough, 1e-6);
    if (smoothed[i] / ref >= PROMINENCE) {
      syllables++;
      lastPeakT = f.t;
    }
  }

  const speakingMin = Math.max(speakingMs / 60000, 1e-6);
  const estSyllablesPerMin = syllables / speakingMin;
  return {
    estSyllablesPerMin,
    estWordsPerMin: estSyllablesPerMin / 1.5,
    speechSegmentCount: segments,
  };
}

function downsampleTimeline(frames: AnalysisFrame[]): MetricsTimeline {
  const step = Math.max(1, Math.ceil(frames.length / TIMELINE_MAX_POINTS));
  const frameMs: number[] = [];
  const pitchHz: (number | null)[] = [];
  const db: number[] = [];
  for (let i = 0; i < frames.length; i += step) {
    frameMs.push(Math.round(frames[i].t));
    pitchHz.push(frames[i].pitchHz);
    db.push(Math.round(frames[i].db * 10) / 10);
  }
  return { frameMs, pitchHz, db };
}

export function aggregateMetrics(
  frames: AnalysisFrame[],
  pauses: PauseSpan[],
  firstSpeechAt: number | null,
  lastSpeechAt: number | null,
  durationMs: number,
  sampleRate: number,
): AudioMetrics {
  return {
    durationMs: Math.round(durationMs),
    sampleRate,
    pitch: computePitchMetrics(frames),
    volume: computeVolumeMetrics(frames),
    pauses: computePauseMetrics(pauses, firstSpeechAt, lastSpeechAt, frames),
    pace: computePaceMetrics(frames),
    timeline: downsampleTimeline(frames),
  };
}
