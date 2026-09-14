"use client";

import { useMemo, useState } from "react";
import { mlContent, flattenSections } from "@/lib/studyMl";
import CategoryTabs from "@/components/study/ml/CategoryTabs";
import WeekAccordion from "@/components/study/ml/WeekAccordion";
import TocSidebar from "@/components/study/ml/TocSidebar";
import SearchBar from "@/components/study/ml/SearchBar";
import LightboxRoot from "@/components/study/LightboxRoot";

function scrollToId(id: string) {
  // 탭 전환 + 아코디언 펼침이 DOM에 반영될 시간을 준 다음 스크롤
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

export default function MlStudyView() {
  const [activeCategory, setActiveCategory] = useState(mlContent[0]?.slug ?? "");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const flatSections = useMemo(() => flattenSections(mlContent), []);
  const category = mlContent.find((c) => c.slug === activeCategory) ?? mlContent[0];

  function toggleWeek(slug: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function jump(categorySlug: string, weekSlug: string, sectionSlug?: string) {
    setActiveCategory(categorySlug);
    setExpandedWeeks((prev) => new Set(prev).add(weekSlug));
    scrollToId(sectionSlug ?? weekSlug);
  }

  if (!category) return null;

  return (
    <div className="space-y-5 pt-4 pb-4">
      <LightboxRoot />

      <SearchBar
        sections={flatSections}
        onJump={(catSlug, weekSlug, sectionSlug) => jump(catSlug, weekSlug, sectionSlug)}
      />

      <CategoryTabs categories={mlContent} active={activeCategory} onChange={setActiveCategory} />

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          {category.weeks.map((week) => (
            <WeekAccordion
              key={week.slug}
              week={week}
              open={expandedWeeks.has(week.slug)}
              onToggle={() => toggleWeek(week.slug)}
            />
          ))}
        </div>

        <TocSidebar
          category={category}
          onJump={(weekSlug, sectionSlug) => jump(category.slug, weekSlug, sectionSlug)}
        />
      </div>
    </div>
  );
}
