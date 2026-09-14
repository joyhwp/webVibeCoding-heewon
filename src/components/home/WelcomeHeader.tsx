"use client";

import { useEffect, useRef, useState } from "react";

type WelcomeHeaderProps = {
  name: string;
  now: Date;
  hasNextEvent: boolean;
  nextEventText: string;
};

const FADE_DISTANCE = 200; // 이 정도 스크롤되면 완전히 사라짐

function formatToday(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
}

function toneForHour(hour: number, name: string): string {
  if (hour < 6) return "Still up? Take care of yourself";
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 18) return "Halfway through the day";
  if (hour < 22) return "Evening's here";
  return "It's late";
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4.5"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 8h14M6.5 3v3M13.5 3v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 10.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeHeader({
  name,
  now,
  hasNextEvent,
  nextEventText,
}: WelcomeHeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollProgress(Math.min(1, window.scrollY / FADE_DISTANCE));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="px-2 pb-2 sm:px-4"
      style={{
        opacity: 1 - scrollProgress,
        transform: `translateY(${-scrollProgress * 28}px)`,
        pointerEvents: scrollProgress > 0.6 ? "none" : "auto",
      }}
    >
      <p className="text-xs font-normal tracking-wide text-foreground/40">
        {toneForHour(now.getHours(), name)}
      </p>
      <h1
        className="mt-2 text-[2.2rem] font-semibold text-[#303030] sm:text-[2.75rem] dark:text-foreground"
        style={{
          fontFamily:
            "var(--font-inter), var(--font-geist-sans), -apple-system, sans-serif",
          letterSpacing: "-0.03em",
        }}
      >
        Welcome, {name}
      </h1>
      <p className="mt-3 text-sm text-foreground/55">{formatToday(now)}</p>

      <div className="mt-5">
        {hasNextEvent ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <CalendarIcon />
            {nextEventText}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/50">
            <CheckIcon />
            No events today
          </span>
        )}
      </div>
    </div>
  );
}
