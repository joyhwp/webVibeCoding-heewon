"use client";

import type { Category } from "@/lib/studyMl";
import MdText from "@/components/study/MdText";

type TocSidebarProps = {
  category: Category;
  onJump: (weekSlug: string, sectionSlug?: string) => void;
};

/** 우측 목차 — 현재 탭(H1) 안의 week(H2)/section(H3)을 클릭하면 해당 위치로 이동 */
export default function TocSidebar({ category, onJump }: TocSidebarProps) {
  return (
    <nav className="glass-panel sticky top-28 hidden max-h-[70vh] w-56 shrink-0 overflow-y-auto rounded-2xl p-4 lg:block">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-foreground/40">
        목차
      </p>
      <ul className="space-y-3">
        {category.weeks.map((week) => (
          <li key={week.slug}>
            <button
              type="button"
              onClick={() => onJump(week.slug)}
              className="text-left text-sm font-medium text-foreground/80 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {week.title}
            </button>
            {week.sections.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-l border-foreground/10 pl-3">
                {week.sections.map((section) => (
                  <li key={section.slug}>
                    <button
                      type="button"
                      onClick={() => onJump(week.slug, section.slug)}
                      className="text-left text-[0.8rem] leading-snug text-foreground/50 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <MdText text={section.title} inline />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
