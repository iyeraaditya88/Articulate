export interface PitchResult {
  hz: number;
  /** NSDF value at the chosen lag, 0..1 — voiced-confidence */
  clarity: number;
}

export interface PitchOptions {
  fMin?: number;
  fMax?: number;
  clarityMin?: number;
}

/**
 * McLeod Pitch Method (MPM): normalized square difference function (NSDF)
 * autocorrelation with key-maxima picking and parabolic interpolation.
 *
 * Chosen over raw ACF because NSDF yields a 0..1 clarity value usable as a
 * voiced/unvoiced gate and resists octave-down errors via McLeod's
 * first-maximum-above-threshold rule.
 *
 * ~1M multiply-adds per 2048-sample frame — well under 1 ms on modern
 * hardware, so no worker is needed at a 50 ms cadence.
 */
export function detectPitchMPM(
  buf: Float32Array,
  sampleRate: number,
  { fMin = 50, fMax = 500, clarityMin = 0.6 }: PitchOptions = {},
): PitchResult | null {
  const W = Math.floor(buf.length / 2);
  const tauMin = Math.max(2, Math.floor(sampleRate / fMax));
  const tauMax = Math.min(W - 1, Math.floor(sampleRate / fMin));
  if (tauMax <= tauMin) return null;

  const nsdf = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i < W; i++) {
      const a = buf[i];
      const b = buf[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Key maxima: highest NSDF point between each positive-going zero crossing.
  const maxima: number[] = [];
  let tau = tauMin;
  // Skip the initial positive region (trivial maximum near lag 0).
  while (tau <= tauMax && nsdf[tau] > 0) tau++;
  while (tau <= tauMax) {
    while (tau <= tauMax && nsdf[tau] <= 0) tau++;
    let bestTau = -1;
    let bestVal = -Infinity;
    while (tau <= tauMax && nsdf[tau] > 0) {
      if (nsdf[tau] > bestVal) {
        bestVal = nsdf[tau];
        bestTau = tau;
      }
      tau++;
    }
    if (bestTau > 0) maxima.push(bestTau);
  }
  if (maxima.length === 0) return null;

  let highest = 0;
  for (const m of maxima) if (nsdf[m] > highest) highest = nsdf[m];
  const threshold = 0.9 * highest;

  // First key maximum above threshold avoids octave-down errors.
  let chosen = -1;
  for (const m of maxima) {
    if (nsdf[m] >= threshold) {
      chosen = m;
      break;
    }
  }
  if (chosen < 0) return null;

  // Parabolic interpolation around the chosen lag for sub-sample precision.
  let refined = chosen;
  if (chosen > tauMin && chosen < tauMax) {
    const y0 = nsdf[chosen - 1];
    const y1 = nsdf[chosen];
    const y2 = nsdf[chosen + 1];
    const denom = y0 - 2 * y1 + y2;
    if (Math.abs(denom) > 1e-9) {
      const delta = (0.5 * (y0 - y2)) / denom;
      if (Math.abs(delta) < 1) refined = chosen + delta;
    }
  }

  const clarity = nsdf[chosen];
  const hz = sampleRate / refined;
  if (clarity < clarityMin || hz < fMin || hz > fMax) return null;
  return { hz, clarity };
}
