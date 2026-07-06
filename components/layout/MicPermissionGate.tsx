"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PRIMED_KEY = "articulate.micPrimed.v1";

type GateView = "hidden" | "prime" | "denied";

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

const DENIED_STEPS: Record<ReturnType<typeof detectPlatform>, string[]> = {
  ios: [
    "Tap the ᴬᴬ (or settings) icon in Safari's address bar",
    "Website Settings → Microphone → Allow",
    "Using Chrome? iPhone Settings → Chrome → turn Microphone on",
    "Reload this page and try again",
  ],
  android: [
    "Tap the lock/tune icon in the address bar",
    "Permissions → Microphone → Allow",
    "Still blocked? Android Settings → Apps → your browser → Permissions → Microphone",
    "Reload this page and try again",
  ],
  other: [
    "Click the lock or mic icon in your browser's address bar",
    "Set Microphone to Allow for this site",
    "Reload this page and try again",
  ],
};

export function MicPermissionGate() {
  const [view, setView] = useState<GateView>("hidden");
  const [requesting, setRequesting] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      )
        return;
      try {
        // Permissions API tells us the state without prompting.
        const status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (cancelled) return;
        if (status.state === "granted") return;
        if (status.state === "denied") {
          setView("denied");
          return;
        }
        setView("prime");
      } catch {
        // Permissions API unavailable (older Safari) — prime once per device.
        if (!cancelled && !window.localStorage.getItem(PRIMED_KEY)) {
          setView("prime");
        }
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestMic = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      // We only wanted the grant — release the mic immediately.
      stream.getTracks().forEach((t) => t.stop());
      window.localStorage.setItem(PRIMED_KEY, "1");
      setView("hidden");
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setView("denied");
      } else {
        window.localStorage.setItem(PRIMED_KEY, "1");
        setView("hidden");
      }
    } finally {
      setRequesting(false);
    }
  };

  const dismiss = () => {
    window.localStorage.setItem(PRIMED_KEY, "1");
    setView("hidden");
  };

  if (view === "hidden") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={38}
            className="h-9 w-auto"
          />
          <h2 className="font-display text-xl">
            {view === "prime"
              ? "Let Articulate hear you"
              : "Microphone is blocked"}
          </h2>
        </div>

        {view === "prime" ? (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Articulate is a speaking coach — it needs your microphone to
              measure your melody, pace, and pauses.{" "}
              <span className="text-foreground">
                Audio is analyzed locally on your device
              </span>{" "}
              and only uploaded when you ask for a coaching analysis.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Your browser will ask for permission next — tap{" "}
              <span className="text-foreground">Allow</span> to unlock
              recording.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                onClick={() => void requestMic()}
                disabled={requesting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-background transition hover:brightness-110 disabled:opacity-50"
              >
                {requesting && (
                  <span className="size-3 animate-spin rounded-full border-2 border-background/40 border-t-background" />
                )}
                Enable microphone
              </button>
              <button
                onClick={dismiss}
                className="rounded-full border border-line px-6 py-3.5 text-[15px] text-muted transition hover:border-accent hover:text-foreground"
              >
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Your browser has microphone access turned off for this site.
              Here&apos;s how to turn it back on:
            </p>
            <ol className="mt-3 space-y-2">
              {DENIED_STEPS[platform].map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-[14px] leading-relaxed text-muted"
                >
                  <span className="font-mono text-xs text-accent">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-background transition hover:brightness-110"
              >
                I&apos;ve enabled it — reload
              </button>
              <button
                onClick={dismiss}
                className="rounded-full border border-line px-6 py-3.5 text-[15px] text-muted transition hover:border-accent hover:text-foreground"
              >
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
