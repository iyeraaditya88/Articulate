export interface SilenceTrackerOptions {
  /** silence runs longer than this count as a pause */
  pauseMinMs?: number;
  /** window used to estimate the adaptive noise floor */
  floorWindowMs?: number;
  /** frames inside this initial span seed the floor and never count as pauses */
  calibrationMs?: number;
}

export interface PauseSpan {
  startMs: number;
  endMs: number;
}

const ENTER_SPEECH_FLOOR_MULT = 3;
const EXIT_SPEECH_FLOOR_MULT = 2;
// Absolute guards so a dead-quiet room doesn't produce a near-zero floor
// that flags breathing as speech.
const ENTER_SPEECH_MIN_RMS = 10 ** (-50 / 20);
const EXIT_SPEECH_MIN_RMS = 10 ** (-55 / 20);

/**
 * Adaptive silence/pause state machine.
 *
 * Noise floor = 10th percentile of frame RMS over a trailing window, seeded
 * during an initial calibration span. Hysteresis (separate enter/exit
 * thresholds) prevents flapping at the boundary. Leading and trailing
 * silence are not pauses — callers get interior spans only via finalize().
 */
export class SilenceTracker {
  private readonly pauseMinMs: number;
  private readonly floorWindowMs: number;
  private readonly calibrationMs: number;

  private samples: { t: number; rms: number }[] = [];
  private speaking = false;
  private silenceStart: number | null = null;
  private firstSpeechAt: number | null = null;
  private lastSpeechAt: number | null = null;
  private spans: PauseSpan[] = [];

  constructor({
    pauseMinMs = 300,
    floorWindowMs = 5000,
    calibrationMs = 300,
  }: SilenceTrackerOptions = {}) {
    this.pauseMinMs = pauseMinMs;
    this.floorWindowMs = floorWindowMs;
    this.calibrationMs = calibrationMs;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }

  get pauseCount(): number {
    return this.spans.length;
  }

  private noiseFloor(now: number): number {
    const cutoff = now - this.floorWindowMs;
    while (this.samples.length > 0 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }
    if (this.samples.length === 0) return EXIT_SPEECH_MIN_RMS;
    const sorted = this.samples.map((s) => s.rms).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.1)];
  }

  /** Feed one frame. Returns whether the frame is classified as speech. */
  push(t: number, rms: number): boolean {
    this.samples.push({ t, rms });
    const floor = this.noiseFloor(t);

    if (t < this.calibrationMs) {
      this.speaking = false;
      return false;
    }

    if (this.speaking) {
      if (rms < Math.max(floor * EXIT_SPEECH_FLOOR_MULT, EXIT_SPEECH_MIN_RMS)) {
        this.speaking = false;
        this.silenceStart = t;
      }
    } else if (
      rms > Math.max(floor * ENTER_SPEECH_FLOOR_MULT, ENTER_SPEECH_MIN_RMS)
    ) {
      this.speaking = true;
      // Close the silence run; interior runs above the minimum are pauses.
      if (
        this.silenceStart !== null &&
        this.firstSpeechAt !== null &&
        t - this.silenceStart >= this.pauseMinMs
      ) {
        this.spans.push({ startMs: this.silenceStart, endMs: t });
      }
      this.silenceStart = null;
      if (this.firstSpeechAt === null) this.firstSpeechAt = t;
    }

    if (this.speaking) this.lastSpeechAt = t;
    return this.speaking;
  }

  /** Interior pause spans plus speech boundaries for trimming. */
  finalize(): {
    pauses: PauseSpan[];
    firstSpeechAt: number | null;
    lastSpeechAt: number | null;
  } {
    return {
      pauses: this.spans.slice(),
      firstSpeechAt: this.firstSpeechAt,
      lastSpeechAt: this.lastSpeechAt,
    };
  }
}
