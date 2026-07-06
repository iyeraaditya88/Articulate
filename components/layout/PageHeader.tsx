export function PageHeader({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
        <span className="inline-block h-px w-6 bg-accent" aria-hidden />
        {overline}
      </p>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
        {description}
      </p>
    </header>
  );
}
