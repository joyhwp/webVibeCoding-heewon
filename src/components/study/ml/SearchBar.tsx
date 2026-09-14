"use client";

import { useMemo, useState } from "react";
import type { FlatSection } from "@/lib/studyMl";
import { searchSections } from "@/lib/studyMl";
import MdText from "@/components/study/MdText";

type SearchBarProps = {
  sections: FlatSection[];
  onJump: (categorySlug: string, weekSlug: string, sectionSlug: string) => void;
};

/** 상단 검색창 — 텍스트/코드/이미지 캡션까지 검색해서 매칭되는 섹션으로 이동 */
export default function SearchBar({ sections, onJump }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchSections(sections, query).slice(0, 12);
  }, [sections, query]);

  return (
    <div className="relative">
      <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2.5">
        <span className="text-foreground/40" aria-hidden="true">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="ML 노트 검색 (텍스트, 코드, 이미지 캡션)"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 text-foreground/40 hover:text-foreground"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {focused && query.trim() && (
        <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-foreground/10 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-foreground/40">
              검색 결과가 없어요.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.categorySlug}-${r.slug}`}
                type="button"
                onMouseDown={() => onJump(r.categorySlug, r.weekSlug, r.slug)}
                className="block w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-foreground/5"
              >
                <p className="text-sm font-medium text-foreground">
                  <MdText text={r.title} inline />
                </p>
                <p className="text-xs text-foreground/45">
                  {r.categoryTitle} · {r.weekTitle}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
