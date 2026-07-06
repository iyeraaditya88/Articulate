export const CLIP_PEAK = 0.98;
export const TOO_QUIET_DB = -40;

export function computeRms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

export function maxAbs(buf: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = Math.abs(buf[i]);
    if (v > peak) peak = v;
  }
  return peak;
}

export function rmsToDb(rms: number): number {
  return 20 * Math.log10(Math.max(rms, 1e-7));
}

export function isClipping(peak: number): boolean {
  return peak > CLIP_PEAK;
}
