"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "clean";

// 기존 라이트/다크 자동 전환(시간대 기준) + 당일 수동 토글 오버라이드 로직.
// Clean 모드 추가와 무관하게 그대로 유지된다 — Clean은 이 결과 위에
// 씌우는 별도의 스킨 레이어일 뿐이다.
type BaseTheme = "light" | "dark";

const OVERRIDE_KEY = "themeOverride:v1";
// Clean 모드 on/off는 날짜와 무관하게 영구 저장 — 재방문 시에도 유지되어야 함
const CLEAN_KEY = "cleanMode:v1";

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 06:00–17:59 라이트, 18:00–05:59 다크 */
function autoTheme(): BaseTheme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function readOverride(): { date: string; theme: BaseTheme } | null {
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

function computeBaseTheme(): BaseTheme {
  const override = readOverride();
  if (override && override.date === todayKey()) return override.theme;
  return autoTheme();
}

function readCleanMode(): boolean {
  try {
    return window.localStorage.getItem(CLEAN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCleanMode(on: boolean) {
  try {
    if (on) window.localStorage.setItem(CLEAN_KEY, "1");
    else window.localStorage.removeItem(CLEAN_KEY);
  } catch {
    // localStorage 접근 실패 시에도 최소한 이번 세션 동안은 반영되게 함
  }
}

type ThemeState = { theme: Theme; base: BaseTheme };

/**
 * Clean이 켜져 있으면 "clean"을, 아니면 기존 라이트/다크 결과를 그대로 반환.
 * base는 Clean이 켜져 있을 때도 항상 계산해둬서, Clean 스킨이 라이트/다크 중
 * 어느 톤(흰색 vs 차콜)을 쓸지 결정하는 데 쓴다.
 */
function computeState(): ThemeState {
  const base = computeBaseTheme();
  return { theme: readCleanMode() ? "clean" : base, base };
}

function applyTheme(state: ThemeState) {
  document.documentElement.setAttribute("data-theme", state.theme);
  if (state.theme === "clean") {
    document.documentElement.setAttribute("data-clean-base", state.base);
  } else {
    document.documentElement.removeAttribute("data-clean-base");
  }
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

let cached: ThemeState | null = null;
function getSnapshot(): Theme {
  if (cached == null) cached = computeState();
  return cached.theme;
}

// 서버에는 시간/localStorage 개념이 없으므로 고정값을 반환 — 실제 테마는
// layout.tsx의 블로킹 스크립트가 하이드레이션 전에 이미 DOM에 적용해두고,
// 이 훅은 (아이콘 등) React가 관리하는 부분을 하이드레이션 직후 맞춰준다.
function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setOverride = useCallback((next: BaseTheme) => {
    try {
      window.localStorage.setItem(
        OVERRIDE_KEY,
        JSON.stringify({ date: todayKey(), theme: next })
      );
    } catch {
      // localStorage 접근 실패 시에도 최소한 이번 세션 동안은 반영되게 함
    }
    cached = { theme: next, base: next };
    applyTheme(cached);
    notify();
  }, []);

  const setCleanMode = useCallback((on: boolean) => {
    writeCleanMode(on);
    cached = computeState();
    applyTheme(cached);
    notify();
  }, []);

  // Light → Dark → Clean → Light 순으로 순환. Clean으로 들어갈 때의 라이트/
  // 다크 톤은 그 시점의 base(자동 시간대 계산 또는 당일 오버라이드)를 그대로 물려받는다.
  const cycle = useCallback(() => {
    if (theme === "light") {
      setOverride("dark");
    } else if (theme === "dark") {
      setCleanMode(true);
    } else {
      setCleanMode(false);
      setOverride("light");
    }
  }, [theme, setOverride, setCleanMode]);

  return { theme, cycle };
}
