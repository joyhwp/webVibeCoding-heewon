"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import NavMenu from "@/components/NavMenu";
import { usePalette, type Palette } from "@/hooks/usePalette";

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/study", label: "Study" },
  { href: "/files", label: "Files" },
  { href: "/memo", label: "Memo" },
] as const;

const PALETTES: { id: Palette; gradient: string; label: string }[] = [
  { id: "sage", gradient: "linear-gradient(135deg, #8B9A6E 0 50%, #EAE2D6 50% 100%)", label: "Sage palette" },
  { id: "navy", gradient: "linear-gradient(135deg, #3F72AF 0 50%, #DBE2EF 50% 100%)", label: "Navy palette" },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function PaletteSwitch() {
  const { palette, setPalette } = usePalette();

  return (
    <div
      className="flex items-center gap-[3px] rounded-full border p-[3px]"
      style={{ borderColor: "var(--hero-line)", background: "var(--hero-card)" }}
    >
      {PALETTES.map((p) => {
        const isActive = palette === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPalette(p.id)}
            aria-label={p.label}
            aria-pressed={isActive}
            className="h-7 w-7 rounded-full transition-transform duration-150 hover:scale-[1.08]"
            style={{
              background: p.gradient,
              boxShadow: isActive
                ? "0 0 0 2px var(--foreground)"
                : "0 0 0 2px transparent",
            }}
          />
        );
      })}
    </div>
  );
}

export default function TabNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-[1160px] px-6 pb-3 pt-4">
      <nav className="hero-nav font-pretendard flex items-center gap-4 rounded-full py-2 pl-5 pr-2">
        <span
          className="flex shrink-0 items-baseline gap-[1px]"
          style={{ color: "var(--foreground)" }}
        >
          <span className="text-base font-extrabold tracking-[-0.03em]">Desk</span>
          <span className="text-sm font-normal" style={{ color: "var(--hero-ink2)" }}>
            (daily)
          </span>
        </span>

        <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cx(
                  "shrink-0 rounded-full px-4 py-2 text-sm transition-colors duration-[180ms]",
                  isActive
                    ? "bg-foreground font-semibold text-background"
                    : "font-medium text-[var(--hero-ink2)] hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <PaletteSwitch />
          <ThemeToggle />
          <NavMenu />
        </div>
      </nav>
    </header>
  );
}
