"use client";

import { useEffect, useRef, useState } from "react";
import type { TimelineTask } from "@/hooks/useSchedule";
import type { ClassSession } from "@/lib/classSchedule";
import { CATEGORY_STYLES } from "@/lib/taskCategory";
import { minutesToLabel, toMinutes } from "@/lib/time";

const DAY_START_MIN = 8 * 60; // 08:00
const DAY_END_MIN = 22 * 60; // 22:00
const FADE_DISTANCE = 260; // 이 정도 스크롤되면 완전히 사라짐

type HomeHeroProps = {
  name: string;
  now: Date;
  todayClasses: ClassSession[];
  items: TimelineTask[];
};

type UpcomingEntry = {
  startMin: number;
  title: string;
  subtitle: string;
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatShortDate(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** "Now" / "in 40 min" / "in 1h 10m" */
function formatRemaining(diffMin: number): string {
  if (diffMin <= 0) return "Now";
  if (diffMin < 60) return `in ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`;
}

function useScrollFade(distance: number): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setProgress(Math.min(1, window.scrollY / distance));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [distance]);

  return progress;
}

/** Home 탭 최상단 — 인사말 카드 + "Up next" 카드. WelcomeHeader를 대체한다. */
export default function HomeHero({ name, now, todayClasses, items }: HomeHeroProps) {
  const scrollProgress = useScrollFade(FADE_DISTANCE);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const activeClasses = todayClasses.filter((c) => !c.cancelled);
  const tasksLeft = items.filter((t) => !t.completed).length;
  const dayElapsedPct = clampPct(
    ((nowMin - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100
  );

  const upcoming: UpcomingEntry[] = [
    ...activeClasses.map((c) => ({
      startMin: toMinutes(c.startTime),
      title: c.subject,
      subtitle: c.room,
    })),
    ...items
      .filter((t) => !t.completed && t.startTime)
      .map((t) => ({
        startMin: toMinutes(t.startTime as string),
        title: t.task,
        subtitle: CATEGORY_STYLES[t.category].label,
      })),
  ]
    .filter((e) => e.startMin >= nowMin)
    .sort((a, b) => a.startMin - b.startMin);

  const upNext = upcoming[0] as UpcomingEntry | undefined;
  const laterToday = upcoming.slice(1, 4);

  return (
    <section
      className="font-pretendard grid grid-cols-1 gap-4 pb-14 pt-0 sm:grid-cols-2"
      style={{ opacity: 1 - scrollProgress }}
    >
      <GreetingCard
        name={name}
        now={now}
        classCount={activeClasses.length}
        tasksLeft={tasksLeft}
        dayElapsedPct={dayElapsedPct}
      />
      <UpNextCard
        nowMin={nowMin}
        dayElapsedPct={dayElapsedPct}
        upNext={upNext}
        laterToday={laterToday}
      />
    </section>
  );
}

function GreetingCard({
  name,
  now,
  classCount,
  tasksLeft,
  dayElapsedPct,
}: {
  name: string;
  now: Date;
  classCount: number;
  tasksLeft: number;
  dayElapsedPct: number;
}) {
  return (
    <div className="hero-glass flex flex-col justify-between gap-11 rounded-[32px] p-9 pb-[30px]">
      <div>
        <span
          className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-1.5 text-[13px]"
          style={{ background: "var(--hero-chip)" }}
        >
          <span className="whitespace-nowrap" style={{ color: "var(--hero-ink3)" }}>
            {greetingForHour(now.getHours())}
          </span>
          <span className="whitespace-nowrap font-semibold" style={{ color: "var(--hero-ink2)" }}>
            {formatShortDate(now)}
          </span>
        </span>

        <h1
          className="mt-6 font-bold text-foreground"
          style={{
            fontSize: "clamp(36px, 4.8vw, 54px)",
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            textWrap: "balance",
          }}
        >
          Hello, {name}.
          <br />
          <span className="font-semibold" style={{ color: "var(--hero-ink3)" }}>
            Let&apos;s make today count.
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-3 border-t pt-[22px]" style={{ borderColor: "var(--hero-line)" }}>
        <Stat label="Classes" value={classCount} />
        <Stat label="Tasks left" value={tasksLeft} bordered />
        <Stat label="Day elapsed" value={`${dayElapsedPct}%`} bordered />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  bordered,
}: {
  label: string;
  value: number | string;
  bordered?: boolean;
}) {
  return (
    <div
      className={bordered ? "border-l pl-5" : undefined}
      style={bordered ? { borderColor: "var(--hero-line)" } : undefined}
    >
      <p className="text-[13px]" style={{ color: "var(--hero-ink3)" }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
        {value}
      </p>
    </div>
  );
}

function UpNextCard({
  nowMin,
  dayElapsedPct,
  upNext,
  laterToday,
}: {
  nowMin: number;
  dayElapsedPct: number;
  upNext?: UpcomingEntry;
  laterToday: UpcomingEntry[];
}) {
  return (
    <div
      className="flex flex-col gap-[22px] rounded-[32px] p-8 text-white"
      style={{
        background: "color-mix(in srgb, var(--accent) 84%, transparent)",
        border: "1px solid rgba(255,255,255,.35)",
        backdropFilter: "blur(var(--hero-blur)) saturate(160%)",
        WebkitBackdropFilter: "blur(var(--hero-blur)) saturate(160%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.4), 0 30px 60px -30px color-mix(in srgb, var(--accent) 80%, transparent)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Up next</span>
        {upNext && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-white/20 px-3 py-[5px] text-[13px] font-semibold">
            {formatRemaining(upNext.startMin - nowMin)}
          </span>
        )}
      </div>

      {upNext ? (
        <>
          <p
            className="font-bold tabular-nums"
            style={{ fontSize: "clamp(52px, 6vw, 68px)", lineHeight: 1, letterSpacing: "-0.045em" }}
          >
            {minutesToLabel(upNext.startMin)}
          </p>
          <div className="-mt-2">
            <p className="text-[22px] font-bold" style={{ letterSpacing: "-0.025em" }}>
              {upNext.title}
            </p>
            <p className="mt-0.5 text-sm font-medium opacity-90">{upNext.subtitle}</p>
          </div>
        </>
      ) : (
        <div>
          <p className="text-[28px] font-bold" style={{ letterSpacing: "-0.03em" }}>
            All done for today
          </p>
          <p className="mt-1 text-sm font-medium opacity-90">
            Nothing left on today&apos;s schedule.
          </p>
        </div>
      )}

      <div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[.28]">
          <div
            className="day-progress-fill h-full rounded-full bg-white"
            style={{ width: `${dayElapsedPct}%`, transition: "width 600ms ease" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-medium">
          <span>08:00</span>
          <span>22:00</span>
        </div>
      </div>

      {laterToday.length > 0 && (
        <div className="mt-auto">
          <p className="pb-2 text-xs font-semibold uppercase tracking-[.04em]">Later today</p>
          {laterToday.map((entry, i) => (
            <div key={`${entry.title}-${i}`} className="flex gap-3.5 border-t border-white/[.22] py-[11px]">
              <span className="w-[46px] shrink-0 text-sm font-semibold tabular-nums">
                {minutesToLabel(entry.startMin)}
              </span>
              <span className="truncate text-sm font-medium">{entry.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
