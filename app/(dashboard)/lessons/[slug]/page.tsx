import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/lib/lessons/content";
import { LessonPractice } from "@/components/lessons/LessonPractice";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/lessons"
          className="text-xs text-muted transition hover:text-accent"
        >
          ← All lessons
        </Link>
        <p className="mb-1.5 mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
          <span className="inline-block h-px w-6 bg-accent" aria-hidden />
          {lesson.category} lesson
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {lesson.title}
          </h1>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Trains {lesson.trains}
          </span>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          {lesson.tagline}
        </p>
      </header>

      {/* Teaching content */}
      <div className="grid gap-4 sm:grid-cols-2">
        {lesson.sections.map((s, i) => (
          <div
            key={s.heading}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p className="mb-2 font-mono text-xs text-accent">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 className="font-display text-base">{s.heading}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Drills */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-1 font-display text-lg">Warm-up drills</h2>
        <p className="mb-4 text-xs text-muted">
          Do these solo before recording — no feedback, just reps.
        </p>
        <ol className="space-y-3">
          {lesson.drills.map((d, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="font-mono text-xs text-accent">{i + 1}</span>
              <span className="text-muted">{d}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Practice set */}
      <LessonPractice lesson={lesson} />
    </div>
  );
}
