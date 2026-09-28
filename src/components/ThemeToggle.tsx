"use client";

import { useTheme } from "@/hooks/useTheme";

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.2v2M10 15.8v2M17.8 10h-2M4.2 10h-2M15.4 4.6l-1.4 1.4M6 14l-1.4 1.4M15.4 15.4L14 14M6 6 4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M17 11.5A7.5 7.5 0 1 1 8.5 3a6 6 0 0 0 8.5 8.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Clean(노션풍) 모드 아이콘 — 얇은 선 형태의 문서/페이지 모양
function CleanIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="4.5" y="2.5" width="11" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.2 7h5.6M7.2 10h5.6M7.2 13h3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NEXT_LABEL: Record<string, string> = {
  light: "Switch to dark mode",
  dark: "Switch to clean mode",
  clean: "Switch to light mode",
};

export default function ThemeToggle() {
  const { theme, cycle } = useTheme();

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={NEXT_LABEL[theme]}
      title={NEXT_LABEL[theme]}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-foreground/70 transition-colors hover:text-foreground"
      style={{ background: "var(--hero-card)", borderColor: "var(--hero-line)" }}
    >
      {theme === "dark" ? (
        <MoonIcon />
      ) : theme === "clean" ? (
        <CleanIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  );
}
