"use client";

import CategoryIcon, {
  type CategoryIconKind,
} from "@/components/today/CategoryIcon";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";

type Stat = {
  label: string;
  value: string;
  iconKind: CategoryIconKind;
};

// 참고 이미지처럼 카드마다 다른 톤을 쓰되, 사이트 기존 카테고리 팔레트에서
// 가져온다 (브라운/오렌지 톤 대신 우리 파스텔 톤 유지)
const ACCENTS = [
  CATEGORY_ACCENT.dearTime,
  CATEGORY_ACCENT.school,
  CATEGORY_ACCENT.assignment,
  CATEGORY_ACCENT.study,
];

export default function BookStatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        return (
          <div
            key={stat.label}
            className="glass-panel flex flex-col gap-2 rounded-2xl border p-4"
            style={{
              background: `color-mix(in srgb, ${accent.solid} 18%, var(--glass-bg))`,
              borderColor: `color-mix(in srgb, ${accent.solid} 35%, var(--glass-border))`,
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: accent.soft, color: accent.solid }}
            >
              <CategoryIcon kind={stat.iconKind} className="h-4 w-4" />
            </span>
            <span className="text-xl font-semibold tabular-nums leading-tight">
              {stat.value}
            </span>
            <span className="text-xs text-foreground/55">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
