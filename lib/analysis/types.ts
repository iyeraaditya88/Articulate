export type LetterGrade = "A" | "B" | "C" | "D";

export interface ScoredComment {
  /** 0–100 */
  score: number;
  comment: string;
}

export interface ToolboxItem {
  /** 0–100 */
  score: number;
  observation: string;
  tip: string;
}

export interface GradedComment {
  grade: LetterGrade;
  comment: string;
}

export interface SinFinding {
  detected: boolean;
  /** short quote from the transcript, or empty when not detected */
  evidence: string;
}

export interface RadarAxisResult extends ScoredComment {
  /** personalized ideal score for this speaker on this axis */
  target?: number;
}

/** The 8 axes of the speaker-profile radar ("web graph"). */
export interface RadarProfile {
  vocalVariety: RadarAxisResult;
  paceControl: RadarAxisResult;
  pauseMastery: RadarAxisResult;
  volumeProjection: RadarAxisResult;
  clarityStructure: RadarAxisResult;
  conciseness: RadarAxisResult;
  engagement: RadarAxisResult;
  connection: RadarAxisResult;
}

/** Fallback ideal profile for analyses saved before targets existed. */
export const DEFAULT_RADAR_TARGETS: Record<keyof RadarProfile, number> = {
  vocalVariety: 85,
  paceControl: 85,
  pauseMastery: 80,
  volumeProjection: 85,
  clarityStructure: 88,
  conciseness: 85,
  engagement: 82,
  connection: 88,
};

export const RADAR_AXES: { key: keyof RadarProfile; label: string }[] = [
  { key: "vocalVariety", label: "Vocal Variety" },
  { key: "paceControl", label: "Pace" },
  { key: "pauseMastery", label: "Pauses" },
  { key: "volumeProjection", label: "Projection" },
  { key: "clarityStructure", label: "Clarity" },
  { key: "conciseness", label: "Conciseness" },
  { key: "engagement", label: "Engagement" },
  { key: "connection", label: "Connection" },
];

export type VoiceType =
  | "bass"
  | "baritone"
  | "tenor"
  | "contralto"
  | "mezzo-soprano"
  | "soprano";

export const VOICE_TYPE_LABELS: Record<VoiceType, string> = {
  bass: "Bass",
  baritone: "Baritone",
  tenor: "Tenor",
  contralto: "Contralto",
  "mezzo-soprano": "Mezzo-Soprano",
  soprano: "Soprano",
};

export interface DeliveryRewrite {
  /** verbatim quote of what the speaker said */
  original: string;
  /** the ideal way to convey the same context, may include [pause] cues */
  improved: string;
  /** why the improved version works better */
  note: string;
}

export interface SpeechAnalysis {
  /** 0–100 composite */
  overallScore: number;
  voice: {
    type: VoiceType;
    description: string;
  };
  /** side-by-side "what you said vs what you could have said" */
  rewrites: DeliveryRewrite[];
  /** e.g. "The Thoughtful Analyst" */
  speakerType: string;
  headline: string;
  summary: string;
  radar: RadarProfile;
  hail: {
    honesty: GradedComment;
    authenticity: GradedComment;
    integrity: GradedComment;
    love: GradedComment;
  };
  sins: {
    gossip: SinFinding;
    judging: SinFinding;
    negativity: SinFinding;
    complaining: SinFinding;
    excuses: SinFinding;
    exaggeration: SinFinding;
    dogmatism: SinFinding;
  };
  vocalToolbox: {
    register: ToolboxItem;
    timbre: ToolboxItem;
    prosody: ToolboxItem;
    pace: ToolboxItem;
    pitch: ToolboxItem;
    volume: ToolboxItem;
  };
  rhetoric: {
    ethos: ScoredComment;
    pathos: ScoredComment;
    logos: ScoredComment;
  };
  fillerWords: {
    count: number;
    perMinute: number;
    examples: string[];
  };
  strengths: string[];
  improvements: string[];
  recommendedLessons: {
    title: string;
    /** which weakness it targets, e.g. "prosody" */
    focus: string;
    description: string;
  }[];
}

export interface TranscriptionResult {
  text: string;
  durationSec: number;
  wordCount: number;
  wordsPerMin: number;
}

export const SIN_LABELS: { key: keyof SpeechAnalysis["sins"]; label: string }[] =
  [
    { key: "gossip", label: "Gossip" },
    { key: "judging", label: "Judging" },
    { key: "negativity", label: "Negativity" },
    { key: "complaining", label: "Complaining" },
    { key: "excuses", label: "Excuses" },
    { key: "exaggeration", label: "Exaggeration" },
    { key: "dogmatism", label: "Dogmatism" },
  ];
