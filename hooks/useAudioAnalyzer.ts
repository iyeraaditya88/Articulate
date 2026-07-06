"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisFrame,
  AudioMetrics,
  LiveAudioState,
  RecorderStatus,
} from "@/lib/audio/types";
import { detectPitchMPM } from "@/lib/audio/pitch";
import { computeRms, isClipping, maxAbs, rmsToDb } from "@/lib/audio/volume";
import { SilenceTracker } from "@/lib/audio/pauses";
import { aggregateMetrics } from "@/lib/audio/metrics";
import { createRecorder } from "@/lib/audio/recorder";

const ANALYSIS_INTERVAL_MS = 50;
const UI_INTERVAL_MS = 100;
const FFT_SIZE = 2048;
// Below this RMS the frame can't be voiced speech — skip pitch detection.
const VOICE_GATE_RMS = 10 ** (-55 / 20);

const IDLE_LIVE: LiveAudioState = {
  status: "idle",
  elapsedMs: 0,
  pitchHz: null,
  pitchClarity: 0,
  rms: 0,
  db: -Infinity,
  isSpeaking: false,
  isClipping: false,
  pauseCount: 0,
};

export interface UseAudioAnalyzerReturn {
  isSupported: boolean;
  status: RecorderStatus;
  error: string | null;
  live: LiveAudioState;
  metrics: AudioMetrics | null;
  audioBlob: Blob | null;
  audioMimeType: string | null;
  start: () => Promise<void>;
  stop: () => Promise<{ blob: Blob; metrics: AudioMetrics } | null>;
  reset: () => void;
}

export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveAudioState>(IDLE_LIVE);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);

  // Hot-loop state lives in refs — zero setState at the 50 ms cadence.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const framesRef = useRef<AnalysisFrame[]>([]);
  const silenceRef = useRef<SilenceTracker | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const startedAtRef = useRef(0);
  const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<RecorderStatus>("idle");

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined" &&
        typeof AudioContext !== "undefined",
    );
  }, []);

  const clearTimers = useCallback(() => {
    if (analysisTimerRef.current !== null) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    if (uiTimerRef.current !== null) {
      clearInterval(uiTimerRef.current);
      uiTimerRef.current = null;
    }
  }, []);

  const releaseAudioGraph = useCallback(async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try {
        await audioCtxRef.current.close();
      } catch {
        // already closing — ignore
      }
    }
    audioCtxRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (statusRef.current === "recording" || statusRef.current === "requesting")
      return;
    statusRef.current = "requesting";
    setStatus("requesting");
    setError(null);
    setMetrics(null);
    setAudioBlob(null);
    setAudioMimeType(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          // AGC off so volume dynamics reflect the speaker, not browser gain.
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(FFT_SIZE);

      chunksRef.current = [];
      const { recorder, mimeType } = createRecorder(stream, (chunk) =>
        chunksRef.current.push(chunk),
      );
      recorderRef.current = recorder;
      setAudioMimeType(mimeType);
      recorder.start(1000);

      framesRef.current = [];
      silenceRef.current = new SilenceTracker();
      startedAtRef.current = performance.now();

      analysisTimerRef.current = setInterval(() => {
        const a = analyserRef.current;
        const buf = bufRef.current;
        const tracker = silenceRef.current;
        if (!a || !buf || !tracker) return;

        a.getFloatTimeDomainData(buf);
        const t = performance.now() - startedAtRef.current;
        const rms = computeRms(buf);
        const peak = maxAbs(buf);
        const pitch =
          rms > VOICE_GATE_RMS
            ? detectPitchMPM(buf, ctx.sampleRate)
            : null;
        const isSpeaking = tracker.push(t, rms);

        framesRef.current.push({
          t,
          rms,
          db: rmsToDb(rms),
          peak,
          pitchHz: pitch?.hz ?? null,
          clarity: pitch?.clarity ?? 0,
          isSpeaking,
        });
      }, ANALYSIS_INTERVAL_MS);

      uiTimerRef.current = setInterval(() => {
        const frames = framesRef.current;
        const tracker = silenceRef.current;
        const last = frames[frames.length - 1];
        if (!last || !tracker) return;
        setLive({
          status: "recording",
          elapsedMs: performance.now() - startedAtRef.current,
          pitchHz: last.pitchHz,
          pitchClarity: last.clarity,
          rms: last.rms,
          db: last.db,
          isSpeaking: last.isSpeaking,
          isClipping: isClipping(last.peak),
          pauseCount: tracker.pauseCount,
        });
      }, UI_INTERVAL_MS);

      statusRef.current = "recording";
      setStatus("recording");
    } catch (e) {
      clearTimers();
      await releaseAudioGraph();
      statusRef.current = "error";
      setStatus("error");
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access was denied. Allow mic access in your browser and try again."
          : e instanceof DOMException && e.name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Could not start recording. Please check your microphone and try again.",
      );
    }
  }, [clearTimers, releaseAudioGraph]);

  const stop = useCallback(async (): Promise<{
    blob: Blob;
    metrics: AudioMetrics;
  } | null> => {
    if (statusRef.current !== "recording") return null;
    const durationMs = performance.now() - startedAtRef.current;
    clearTimers();

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      // Await onstop so the final chunk is flushed before building the Blob.
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }
    recorderRef.current = null;

    const sampleRate = audioCtxRef.current?.sampleRate ?? 48000;
    await releaseAudioGraph();

    const mimeType = audioMimeType ?? "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const { pauses, firstSpeechAt, lastSpeechAt } =
      silenceRef.current?.finalize() ?? {
        pauses: [],
        firstSpeechAt: null,
        lastSpeechAt: null,
      };
    const result = aggregateMetrics(
      framesRef.current,
      pauses,
      firstSpeechAt,
      lastSpeechAt,
      durationMs,
      sampleRate,
    );

    setAudioBlob(blob);
    setMetrics(result);
    statusRef.current = "stopped";
    setStatus("stopped");
    setLive((prev) => ({ ...prev, status: "stopped", isSpeaking: false }));
    return { blob, metrics: result };
  }, [audioMimeType, clearTimers, releaseAudioGraph]);

  const reset = useCallback(() => {
    if (statusRef.current === "recording") return;
    framesRef.current = [];
    chunksRef.current = [];
    silenceRef.current = null;
    setMetrics(null);
    setAudioBlob(null);
    setAudioMimeType(null);
    setError(null);
    statusRef.current = "idle";
    setStatus("idle");
    setLive(IDLE_LIVE);
  }, []);

  // Teardown on unmount (e.g. navigating away mid-recording).
  useEffect(() => {
    return () => {
      clearTimers();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    };
  }, [clearTimers]);

  return {
    isSupported,
    status,
    error,
    live,
    metrics,
    audioBlob,
    audioMimeType,
    start,
    stop,
    reset,
  };
}
