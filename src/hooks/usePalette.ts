"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Palette = "sage" | "navy";

const STORAGE_KEY = "palette:v1";

function readPalette(): Palette {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "navy" ? "navy" : "sage";
  } catch {
    return "sage";
  }
}

function applyPalette(palette: Palette) {
  document.documentElement.setAttribute("data-palette", palette);
}

// useTheme.ts와 같은 패턴 — SSR에서는 항상 "sage"를 반환하고, 하이드레이션
// 직후 실제 저장된 값으로 맞춘다(layout.tsx의 블로킹 스크립트가 그 사이
// DOM에는 이미 올바른 값을 적용해 둔다).
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let cached: Palette | null = null;
function getSnapshot(): Palette {
  if (cached == null) cached = readPalette();
  return cached;
}

function getServerSnapshot(): Palette {
  return "sage";
}

/** 상단 네비 팔레트 스위처(TabNav.tsx)가 다루는 accent 팔레트 — 세이지/네이비. */
export function usePalette() {
  const palette = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPalette = useCallback((next: Palette) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage를 못 쓰는 환경이어도 최소한 이번 세션 동안은 반영되게 함
    }
    cached = next;
    applyPalette(next);
    notify();
  }, []);

  return { palette, setPalette };
}
