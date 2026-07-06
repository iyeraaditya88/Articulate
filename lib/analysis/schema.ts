/**
 * Strict JSON schema for the analysis structured output — wire format.
 *
 * Keyed sub-objects (radar.vocalVariety, sins.gossip, …) each compile to
 * their own grammar rules and the API rejects the result as too large
 * ("compiled grammar is too large"). So the wire format uses arrays with an
 * enum discriminator — each item schema compiles once — and the server
 * converts to the keyed `SpeechAnalysis` shape in convert.ts.
 *
 * Other structured-outputs constraints: every object needs
 * `additionalProperties: false` + full `required`; numeric ranges aren't
 * supported, so 0-100 bounds are enforced in the prompt.
 */

export const RADAR_KEYS = [
  "vocalVariety",
  "paceControl",
  "pauseMastery",
  "volumeProjection",
  "clarityStructure",
  "conciseness",
  "engagement",
  "connection",
] as const;

export const HAIL_KEYS = ["honesty", "authenticity", "integrity", "love"] as const;

export const SIN_KEYS = [
  "gossip",
  "judging",
  "negativity",
  "complaining",
  "excuses",
  "exaggeration",
  "dogmatism",
] as const;

export const TOOLBOX_KEYS = [
  "register",
  "timbre",
  "prosody",
  "pace",
  "pitch",
  "volume",
] as const;

export const RHETORIC_KEYS = ["ethos", "pathos", "logos"] as const;

export const VOICE_TYPES = [
  "bass",
  "baritone",
  "tenor",
  "contralto",
  "mezzo-soprano",
  "soprano",
] as const;

/** What the model actually returns. */
export interface RawAnalysis {
  overallScore: number;
  voice: { type: (typeof VOICE_TYPES)[number]; description: string };
  rewrites: { original: string; improved: string; note: string }[];
  speakerType: string;
  headline: string;
  summary: string;
  radar: { axis: (typeof RADAR_KEYS)[number]; score: number; comment: string }[];
  hail: {
    dimension: (typeof HAIL_KEYS)[number];
    grade: "A" | "B" | "C" | "D";
    comment: string;
  }[];
  detectedSins: { sin: (typeof SIN_KEYS)[number]; evidence: string }[];
  vocalToolbox: {
    tool: (typeof TOOLBOX_KEYS)[number];
    score: number;
    observation: string;
    tip: string;
  }[];
  rhetoric: {
    appeal: (typeof RHETORIC_KEYS)[number];
    score: number;
    comment: string;
  }[];
  fillerWords: { count: number; perMinute: number; examples: string[] };
  strengths: string[];
  improvements: string[];
  recommendedLessons: { title: string; focus: string; description: string }[];
}

function enumArray(
  discriminator: string,
  values: readonly string[],
  extraProps: Record<string, object>,
) {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        [discriminator]: { type: "string", enum: [...values] },
        ...extraProps,
      },
      required: [discriminator, ...Object.keys(extraProps)],
      additionalProperties: false,
    },
  };
}

const str = { type: "string" } as const;
const int = { type: "integer" } as const;

export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    overallScore: int,
    voice: {
      type: "object",
      properties: {
        type: { type: "string", enum: [...VOICE_TYPES] },
        description: str,
      },
      required: ["type", "description"],
      additionalProperties: false,
    },
    rewrites: {
      type: "array",
      items: {
        type: "object",
        properties: { original: str, improved: str, note: str },
        required: ["original", "improved", "note"],
        additionalProperties: false,
      },
    },
    speakerType: str,
    headline: str,
    summary: str,
    radar: enumArray("axis", RADAR_KEYS, { score: int, comment: str }),
    hail: enumArray("dimension", HAIL_KEYS, {
      grade: { type: "string", enum: ["A", "B", "C", "D"] },
      comment: str,
    }),
    detectedSins: enumArray("sin", SIN_KEYS, { evidence: str }),
    vocalToolbox: enumArray("tool", TOOLBOX_KEYS, {
      score: int,
      observation: str,
      tip: str,
    }),
    rhetoric: enumArray("appeal", RHETORIC_KEYS, { score: int, comment: str }),
    fillerWords: {
      type: "object",
      properties: {
        count: int,
        perMinute: { type: "number" },
        examples: { type: "array", items: str },
      },
      required: ["count", "perMinute", "examples"],
      additionalProperties: false,
    },
    strengths: { type: "array", items: str },
    improvements: { type: "array", items: str },
    recommendedLessons: {
      type: "array",
      items: {
        type: "object",
        properties: { title: str, focus: str, description: str },
        required: ["title", "focus", "description"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "overallScore",
    "voice",
    "rewrites",
    "speakerType",
    "headline",
    "summary",
    "radar",
    "hail",
    "detectedSins",
    "vocalToolbox",
    "rhetoric",
    "fillerWords",
    "strengths",
    "improvements",
    "recommendedLessons",
  ],
  additionalProperties: false,
} as const;
