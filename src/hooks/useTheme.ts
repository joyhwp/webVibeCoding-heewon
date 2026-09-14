"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const OVERRIDE_KEY = "themeOverride:v1";

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 06:00–17:59 라이트, 18:00–05:59 다크 */
function autoTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function readOverride(): { date: string; theme: Theme } | null {
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.date === "string" &&
      (parsed.theme === "light" || parsed.theme === "dark")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function computeTheme(): Theme {
  const override = readOverride();
  if (override && override.date === todayKey()) return override.theme;
  return autoTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

// 여러 컴포넌트가 동시에 useTheme()을 쓸 수 있으니, 변경을 구독자들에게 알리는
// 아주 가벼운 이벤트 버스 (localStorage/DOM 바깥의 진짜 "외부 스토어"는 아니지만
// useSyncExternalStore가 요구하는 subscribe/getSnapshot 계약을 그대로 따른다)
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let cached: Theme | null = null;
function getSnapshot(): Theme {
  if (cached == null) cached = computeTheme();
  return cached;
}

// 서버에는 시간/localStorage 개념이 없으므로 고정값을 반환 — 실제 테마는
// layout.tsx의 블로킹 스크립트가 하이드레이션 전에 이미 DOM에 적용해두고,
// 이 훅은 (아이콘 등) React가 관리하는 부분을 하이드레이션 직후 맞춰준다.
function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setOverride = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(
        OVERRIDE_KEY,
        JSON.stringify({ date: todayKey(), theme: next })
      );
    } catch {
      // localStorage 접근 실패 시에도 최소한 이번 세션 동안은 반영되게 함
    }
    cached = next;
    applyTheme(next);
    notify();
  }, []);

  const toggle = useCallback(() => {
    setOverride(theme === "dark" ? "light" : "dark");
  }, [theme, setOverride]);

  return { theme, toggle };
}
