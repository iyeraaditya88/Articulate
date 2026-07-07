import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getQuestion } from "@/lib/interview/questions";
import {
  INTERVIEW_FEEDBACK_SCHEMA,
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewFeedbackMessage,
  type InterviewFeedback,
} from "@/lib/interview/feedback";
import type { TranscriptionResult } from "@/lib/analysis/types";
import type { AudioMetrics } from "@/lib/audio/types";
import {
  logUsage,
  resolveModels,
  supportsEffort,
} from "@/lib/analysis/modelConfig";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local." },
      { status: 500 },
    );
  }

  let body: {
    questionId?: string;
    transcription?: TranscriptionResult;
    metrics?: AudioMetrics;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { questionId, transcription, metrics } = body;
  const question = questionId ? getQuestion(questionId) : undefined;
  if (!question || !transcription || !metrics) {
    return NextResponse.json(
      { error: "questionId, transcription and metrics are required." },
      { status: 400 },
    );
  }
  if (transcription.wordCount < 5) {
    return NextResponse.json(
      { error: "Not enough speech to evaluate — try answering in full." },
      { status: 422 },
    );
  }

  const client = new Anthropic();
  const { interviewModel: model, effort } = resolveModels();

  try {
    const response = await client.messages
      .stream({
        model,
        max_tokens: 16000,
        system: [
          {
            type: "text",
            text: INTERVIEW_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: buildInterviewFeedbackMessage(
              question,
              transcription,
              metrics,
            ),
          },
        ],
        output_config: {
          ...(supportsEffort(model) ? { effort } : {}),
          format: {
            type: "json_schema",
            schema: INTERVIEW_FEEDBACK_SCHEMA as unknown as Record<
              string,
              unknown
            >,
          },
        },
      })
      .finalMessage();

    const costUsd = logUsage("interview-feedback", model, response.usage);

    if (response.stop_reason !== "end_turn") {
      return NextResponse.json(
        { error: "Feedback generation was interrupted. Please try again." },
        { status: 502 },
      );
    }
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) {
      return NextResponse.json(
        { error: "The model returned no output." },
        { status: 502 },
      );
    }
    const feedback = JSON.parse(text) as InterviewFeedback;
    feedback.overallScore = Math.max(
      0,
      Math.min(100, Math.round(feedback.overallScore)),
    );
    return NextResponse.json({ feedback, costUsd });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Anthropic rejected the API key. Check ANTHROPIC_API_KEY." },
        { status: 502 },
      );
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Wait a moment and retry." },
        { status: 429 },
      );
    }
    console.error("Interview feedback failed:", e);
    return NextResponse.json(
      { error: "Feedback failed. Please try again." },
      { status: 502 },
    );
  }
}
