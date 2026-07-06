"use client";

import { useRef, useState } from "react";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { saveSession, updateSession } from "@/lib/sessions";
import type {
  SpeechAnalysis,
  TranscriptionResult,
} from "@/lib/analysis/types";
import { RecordingControls } from "./RecordingControls";
import { LiveMeters } from "./LiveMeters";
import { SessionSummary } from "./SessionSummary";
import { AnalysisPanel } from "./AnalysisPanel";

export type AnalysisStage =
  | "idle"
  | "transcribing"
  | "analyzing"
  | "done"
  | "error";

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // fall through
  }
  return "Something went wrong. Please try again.";
}

export function PracticeRoom() {
  const analyzer = useAudioAnalyzer();
  const sessionIdRef = useRef<string | null>(null);

  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const resetAnalysis = () => {
    setStage("idle");
    setAnalysisError(null);
    setAnalysis(null);
    setTranscript(null);
    sessionIdRef.current = null;
  };

  const handleStart = () => {
    resetAnalysis();
    void analyzer.start();
  };

  const handleStop = async () => {
    const result = await analyzer.stop();
    if (result && sessionIdRef.current === null) {
      sessionIdRef.current = saveSession(result.metrics).id;
    }
  };

  const handleReset = () => {
    resetAnalysis();
    analyzer.reset();
  };

  const handleAnalyze = async () => {
    if (!analyzer.audioBlob || !analyzer.metrics) return;
    setAnalysisError(null);
    setStage("transcribing");

    try {
      const form = new FormData();
      form.append(
        "audio",
        new File([analyzer.audioBlob], "recording", {
          type: analyzer.audioMimeType ?? "audio/webm",
        }),
      );
      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      if (!tRes.ok) throw new Error(await readError(tRes));
      const transcription = (await tRes.json()) as TranscriptionResult;
      setTranscript(transcription.text);

      setStage("analyzing");
      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription, metrics: analyzer.metrics }),
      });
      if (!aRes.ok) throw new Error(await readError(aRes));
      const { analysis: result } = (await aRes.json()) as {
        analysis: SpeechAnalysis;
      };

      setAnalysis(result);
      setStage("done");
      if (sessionIdRef.current) {
        updateSession(sessionIdRef.current, {
          transcript: transcription.text,
          analysis: result,
        });
      }
    } catch (e) {
      setStage("error");
      setAnalysisError(
        e instanceof Error ? e.message : "Analysis failed. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <RecordingControls
          status={analyzer.status}
          isSupported={analyzer.isSupported}
          error={analyzer.error}
          elapsedMs={analyzer.live.elapsedMs}
          onStart={handleStart}
          onStop={() => void handleStop()}
          onReset={handleReset}
        />
      </div>

      {analyzer.status === "recording" && <LiveMeters live={analyzer.live} />}

      {analyzer.status === "stopped" && analyzer.metrics && (
        <SessionSummary
          metrics={analyzer.metrics}
          audioBlob={analyzer.audioBlob}
          stage={stage}
          analysisError={analysisError}
          onAnalyze={() => void handleAnalyze()}
        />
      )}

      {transcript !== null && stage === "done" && (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-2 font-display text-lg">Transcript</h3>
          <p className="text-sm leading-relaxed text-muted">{transcript}</p>
        </div>
      )}

      {analysis && stage === "done" && <AnalysisPanel analysis={analysis} />}
    </div>
  );
}
