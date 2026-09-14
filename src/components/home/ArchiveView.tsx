"use client";

import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CategoryIcon from "@/components/today/CategoryIcon";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

export default function ArchiveView() {
  const { hasMounted, archivedItems, restore, remove } = useProgress();

  if (!hasMounted) return <div className="pt-4" />;

  return (
    <div className="pt-4">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/home"
            className="text-xs font-medium text-foreground/45 hover:text-foreground/80"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            완료한 것들
          </h1>
        </div>
      </div>

      {archivedItems.length === 0 ? (
        <GlassCard>
          <p className="text-sm text-foreground/50">
            No completed items yet — finish something in the In Progress
            widget on the Home tab and it&apos;ll show up here.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archivedItems.map((item) => {
            const accent = CATEGORY_ACCENT[item.category];
            return (
              <div
                key={item.id}
                className="glass-panel flex flex-col gap-3 rounded-2xl border p-5"
                style={{
                  background: `color-mix(in srgb, ${accent.solid} 16%, var(--glass-bg))`,
                  borderColor: `color-mix(in srgb, ${accent.solid} 35%, var(--glass-border))`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: accent.soft, color: accent.solid }}
                  >
                    <CategoryIcon kind={item.category} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight line-through opacity-70">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-foreground/45">
                      Completed {formatDate(item.completedAt as number)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => restore(item.id)}
                    className="font-medium hover:opacity-80"
                    style={{ color: accent.solid }}
                  >
                    ↺ Restore to In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Delete permanently"
                    className="text-foreground/40 hover:text-foreground/70"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
