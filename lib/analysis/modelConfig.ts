/** Model routing, effort support, and cost accounting for the analysis APIs. */

export interface ModelRouting {
  analysisModel: string;
  lessonModel: string;
  effort: "low" | "medium" | "high";
}

export function resolveModels(): ModelRouting {
  const effortRaw = process.env.ANALYSIS_EFFORT ?? "medium";
  const effort = (["low", "medium", "high"] as const).includes(
    effortRaw as never,
  )
    ? (effortRaw as ModelRouting["effort"])
    : "medium";
  return {
    analysisModel: process.env.ANALYSIS_MODEL ?? "claude-sonnet-5",
    lessonModel: process.env.LESSON_MODEL ?? "claude-haiku-4-5",
    effort,
  };
}

/** The effort parameter 400s on Haiku 4.5 / Sonnet 4.5 — only send it to
 * models that support it. */
export function supportsEffort(model: string): boolean {
  if (model.includes("haiku")) return false;
  if (model.includes("sonnet-4-5")) return false;
  return (
    model.includes("sonnet") ||
    model.includes("opus") ||
    model.includes("fable")
  );
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Per-MTok pricing (standard, USD). Unknown models fall back to Sonnet. */
const PRICES: [match: string, inPerM: number, outPerM: number][] = [
  ["haiku-4-5", 1, 5],
  ["sonnet", 3, 15],
  ["opus", 5, 25],
  ["fable", 10, 50],
];

export function computeCostUsd(model: string, usage: UsageLike): number {
  const [, inPerM, outPerM] =
    PRICES.find(([m]) => model.includes(m)) ?? ["", 3, 15];
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cost =
    (usage.input_tokens / 1e6) * inPerM +
    (cacheRead / 1e6) * inPerM * 0.1 +
    (cacheWrite / 1e6) * inPerM * 1.25 +
    (usage.output_tokens / 1e6) * outPerM;
  return Math.round(cost * 1e5) / 1e5;
}

export function logUsage(
  route: string,
  model: string,
  usage: UsageLike,
): number {
  const cost = computeCostUsd(model, usage);
  console.log(
    `[${route}] model=${model} in=${usage.input_tokens} out=${usage.output_tokens} ` +
      `cacheRead=${usage.cache_read_input_tokens ?? 0} cost≈$${cost.toFixed(4)}`,
  );
  return cost;
}
