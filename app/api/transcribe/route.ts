import { NextResponse } from "next/server";
import type { TranscriptionResult } from "@/lib/analysis/types";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // Groq's file limit

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured. Add it to .env.local." },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "No audio file received." },
      { status: 400 },
    );
  }
  if (audio.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Recording is too large to transcribe (max 25 MB)." },
      { status: 413 },
    );
  }

  const ext = audio.type.includes("mp4") ? "m4a" : "webm";
  const groqForm = new FormData();
  groqForm.append("file", audio, `recording.${ext}`);
  groqForm.append("model", GROQ_MODEL);
  groqForm.append("response_format", "verbose_json");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: groqForm,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Groq transcription failed:", res.status, detail);
    return NextResponse.json(
      {
        error:
          res.status === 401
            ? "Groq rejected the API key. Check GROQ_API_KEY in .env.local."
            : "Transcription failed. Please try again.",
      },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { text?: string; duration?: number };
  const text = (data.text ?? "").trim();
  const durationSec = data.duration ?? 0;
  const wordCount = text === "" ? 0 : text.split(/\s+/).length;
  const wordsPerMin = durationSec > 0 ? (wordCount / durationSec) * 60 : 0;

  const result: TranscriptionResult = {
    text,
    durationSec,
    wordCount,
    wordsPerMin,
  };
  return NextResponse.json(result);
}
