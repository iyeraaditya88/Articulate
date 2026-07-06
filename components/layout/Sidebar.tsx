"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/practice",
    label: "Trial Room",
    shortLabel: "Trial",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
        <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 9.5a6 6 0 0 0 12 0M10 15.5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/lessons",
    label: "Lessons",
    shortLabel: "Lessons",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
        <path
          d="M10 4.5C8.5 3.3 6.4 3 4 3v13c2.4 0 4.5.3 6 1.5 1.5-1.2 3.6-1.5 6-1.5V3c-2.4 0-4.5.3-6 1.5ZM10 4.5v13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress Tracker",
    shortLabel: "Progress",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
        <path d="M3 17V11M8.5 17V7M14 17v-4M19 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">
        <svg viewBox="0 0 20 20" fill="none" className="size-4.5" aria-hidden>
          <path
            d="M3 10h2.5M14.5 10H17M6.5 6.5v7M10 3.5v13M13.5 6.5v7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-xl tracking-tight">Articulate</span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 py-7">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1.5 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-foreground hover:bg-surface-raised hover:text-accent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-5 pb-7 text-xs leading-relaxed text-muted">
          Grounded in Julian Treasure&apos;s HAIL &amp; Vocal Toolbox
          frameworks.
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-center border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-accent" : "text-foreground"
              }`}
            >
              {item.icon}
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
