"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LESSONS } from "@/lib/lessons/content";
import {
  bestScore,
  loadLessonProgress,
  type LessonProgress,
} from "@/lib/lessons/progress";

const CATEGORY_ORDER = ["Voice", "Delivery", "Content", "Connection"] as const;

export function LessonLibrary() {
  const [progress, setProgress] = useState<LessonProgress>({});

  useEffect(() => {
    setProgress(loadLessonProgress());
  }, []);

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => {
        const lessons = LESSONS.filter((l) => l.category === cat);
        if (lessons.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">
              {cat}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {lessons.map((l) => {
                const attempts = progress[l.slug];
                const best = bestScore(attempts);
                return (
                  <Link
                    key={l.slug}
                    href={`/lessons/${l.slug}`}
                    className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-accent">
                          Trains {l.trains}
                        </p>
                        <h3 className="mt-1 font-display text-lg group-hover:text-accent">
                          {l.title}
                        </h3>
                      </div>
                      {best !== null && (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-soft font-mono text-xs text-accent">
                          {best}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">
                      {l.tagline}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      {attempts?.length
                        ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`
                        : "Not practiced yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
