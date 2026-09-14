"use client";

import type { Category } from "@/lib/studyMl";
import MdText from "@/components/study/MdText";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type CategoryTabsProps = {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
};

/** H1(대분류)을 상단 탭으로 — TabNav와 같은 pill 스타일 */
export default function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-1 rounded-full p-1.5">
      {categories.map((cat) => {
        const isActive = cat.slug === active;
        return (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onChange(cat.slug)}
            className={cx(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 sm:px-5",
              isActive
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            <MdText text={cat.title} inline />
          </button>
        );
      })}
    </div>
  );
}
