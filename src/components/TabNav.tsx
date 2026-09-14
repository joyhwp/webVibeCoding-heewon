"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import NavMenu from "@/components/NavMenu";

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/study", label: "Study" },
  { href: "/files", label: "Files" },
  { href: "/memo", label: "Memo" },
] as const;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TabNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-50 mx-auto mb-8 grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
      {/* 왼쪽 spacer — 가운데 nav 정렬을 오른쪽 토글과 무관하게 유지 */}
      <div aria-hidden="true" />

      <nav className="glass-panel flex items-center justify-center gap-1 rounded-full p-1.5">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 sm:px-5",
                isActive
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-end gap-2">
        <ThemeToggle />
        <NavMenu />
      </div>
    </header>
  );
}
