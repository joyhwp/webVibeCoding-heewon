"use client";

import type { Week } from "@/lib/studyMl";
import SectionCard from "@/components/study/ml/SectionCard";
import BlockRenderer from "@/components/study/BlockRenderer";

type WeekAccordionProps = {
  week: Week;
  open: boolean;
  onToggle: () => void;
};

/** H2(week)를 아코디언으로 — 기본 접힘, 안에 H3 카드들이 들어간다 */
export default function WeekAccordion({ week, open, onToggle }: WeekAccordionProps) {
  const isEmpty = week.sections.length === 0 && week.intro.length === 0;

  return (
    <div
      id={week.slug}
      className="glass-panel scroll-mt-28 overflow-hidden rounded-3xl"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
      >
        <span className="text-base font-semibold tracking-tight text-foreground">
          {week.title}
        </span>
        <span
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/50 transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-foreground/10 px-5 pb-6 pt-4 sm:px-6">
          {isEmpty ? (
            <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-6 text-center text-sm text-foreground/40">
              정리 예정
            </p>
          ) : (
            <>
              {week.intro.length > 0 && <BlockRenderer blocks={week.intro} />}
              {week.sections.map((section) => (
                <SectionCard key={section.slug} section={section} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
