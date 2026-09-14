"use client";

// study 탭의 최상위 "과목" 레벨 스위처. 지금은 ML(콘텐츠)과 Books(DEAR Time
// 독서 기록)만 있지만, 나중에 다른 과목이 추가되면 이 배열에 나란히 늘어선다.
// MlStudyView 내부의 CategoryTabs(그 과목 안의 대분류 탭)와는 다른 레벨.

import { useState } from "react";
import MlStudyView from "@/components/study/ml/MlStudyView";
import BooksView from "@/components/study/books/BooksView";

const SUBJECTS = [
  { slug: "ml", label: "ML" },
  { slug: "books", label: "Books" },
] as const;

type SubjectSlug = (typeof SUBJECTS)[number]["slug"];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function StudyShell() {
  const [subject, setSubject] = useState<SubjectSlug>("ml");

  return (
    <div className="pt-4 pb-4">
      <div className="glass-panel mb-5 flex flex-wrap items-center gap-1 rounded-full p-1.5">
        {SUBJECTS.map((s) => {
          const isActive = s.slug === subject;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSubject(s.slug)}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 sm:px-5",
                isActive
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {subject === "ml" ? <MlStudyView /> : <BooksView />}
    </div>
  );
}
