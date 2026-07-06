import type {
  RawAnalysis,
} from "./schema";
import {
  HAIL_KEYS,
  RADAR_KEYS,
  RHETORIC_KEYS,
  SIN_KEYS,
  TOOLBOX_KEYS,
} from "./schema";
import type { SpeechAnalysis } from "./types";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Convert the array-based wire format into the keyed SpeechAnalysis shape.
 * Tolerates missing/duplicate entries (first entry per key wins; missing
 * keys get neutral defaults) so a slightly off model output never crashes
 * the UI. */
export function toSpeechAnalysis(raw: RawAnalysis): SpeechAnalysis {
  const radar = Object.fromEntries(
    RADAR_KEYS.map((k) => {
      const item = raw.radar.find((r) => r.axis === k);
      const score = clamp(item?.score ?? 50);
      const targetItem = raw.radarTargets?.find((t) => t.axis === k);
      // Ideal must sit at or above the current score to read sensibly.
      const target = clamp(Math.max(targetItem?.target ?? 85, score));
      return [k, { score, comment: item?.comment ?? "", target }];
    }),
  ) as unknown as SpeechAnalysis["radar"];

  const hail = Object.fromEntries(
    HAIL_KEYS.map((k) => {
      const item = raw.hail.find((h) => h.dimension === k);
      return [k, { grade: item?.grade ?? "B", comment: item?.comment ?? "" }];
    }),
  ) as unknown as SpeechAnalysis["hail"];

  const sins = Object.fromEntries(
    SIN_KEYS.map((k) => {
      const item = raw.detectedSins.find((s) => s.sin === k);
      return [
        k,
        { detected: item !== undefined, evidence: item?.evidence ?? "" },
      ];
    }),
  ) as unknown as SpeechAnalysis["sins"];

  const vocalToolbox = Object.fromEntries(
    TOOLBOX_KEYS.map((k) => {
      const item = raw.vocalToolbox.find((t) => t.tool === k);
      return [
        k,
        {
          score: clamp(item?.score ?? 50),
          observation: item?.observation ?? "",
          tip: item?.tip ?? "",
        },
      ];
    }),
  ) as unknown as SpeechAnalysis["vocalToolbox"];

  const rhetoric = Object.fromEntries(
    RHETORIC_KEYS.map((k) => {
      const item = raw.rhetoric.find((r) => r.appeal === k);
      return [
        k,
        { score: clamp(item?.score ?? 50), comment: item?.comment ?? "" },
      ];
    }),
  ) as unknown as SpeechAnalysis["rhetoric"];

  return {
    overallScore: clamp(raw.overallScore),
    voice: raw.voice,
    rewrites: raw.rewrites.slice(0, 3),
    speakerType: raw.speakerType,
    headline: raw.headline,
    summary: raw.summary,
    radar,
    hail,
    sins,
    vocalToolbox,
    rhetoric,
    fillerWords: {
      count: Math.max(0, Math.round(raw.fillerWords.count)),
      perMinute: Math.max(0, raw.fillerWords.perMinute),
      examples: raw.fillerWords.examples,
    },
    strengths: raw.strengths,
    improvements: raw.improvements,
    recommendedLessons: raw.recommendedLessons.slice(0, 3),
  };
}
