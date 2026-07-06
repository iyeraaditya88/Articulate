import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SCHEMA, type RawAnalysis } from "@/lib/analysis/schema";
import { toSpeechAnalysis } from "@/lib/analysis/convert";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserMessage,
} from "@/lib/analysis/prompt";
import type { SpeechAnalysis, TranscriptionResult } from "@/lib/analysis/types";
import type { AudioMetrics } from "@/lib/audio/types";

const DEFAULT_MODEL = "claude-sonnet-5";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local." },
      { status: 500 },
    );
  }

  let body: {
    transcription?: TranscriptionResult;
    metrics?: AudioMetrics;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { transcription, metrics } = body;
  if (!transcription || !metrics) {
    return NextResponse.json(
      { error: "Both transcription and metrics are required." },
      { status: 400 },
    );
  }
  if (transcription.wordCount < 5) {
    return NextResponse.json(
      {
        error:
          "Not enough speech to analyze — try a recording of at least a few sentences.",
      },
      { status: 422 },
    );
  }

  const client = new Anthropic();
  const model = process.env.ANALYSIS_MODEL ?? DEFAULT_MODEL;

  try {
    // Stream + finalMessage: thinking tokens share the max_tokens budget, so
    // give generous headroom; streaming avoids SDK HTTP-timeout limits.
    const response = await client.messages
      .stream({
        model,
        max_tokens: 24000,
      system: [
        {
          type: "text",
          text: ANALYSIS_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildAnalysisUserMessage(transcription, metrics),
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      })
      .finalMessage();

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The analysis model declined this request." },
        { status: 502 },
      );
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Analysis was cut short. Please try again." },
        { status: 502 },
      );
    }

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) {
      return NextResponse.json(
        { error: "The analysis model returned no output." },
        { status: 502 },
      );
    }
    const raw = JSON.parse(text) as RawAnalysis;
    const analysis: SpeechAnalysis = toSpeechAnalysis(raw);
    return NextResponse.json({ analysis, model: response.model });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        {
          error:
            "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env.local.",
        },
        { status: 502 },
      );
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by the analysis API. Wait a moment and retry." },
        { status: 429 },
      );
    }
    if (e instanceof Anthropic.NotFoundError) {
      return NextResponse.json(
        {
          error: `Model "${model}" was not found. Check ANALYSIS_MODEL in .env.local.`,
        },
        { status: 502 },
      );
    }
    console.error("Analysis failed:", e);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 502 },
    );
  }
}
