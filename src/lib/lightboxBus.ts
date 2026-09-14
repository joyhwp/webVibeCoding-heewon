"use client";

import { useCallback, useSyncExternalStore } from "react";

// 아코디언/콜아웃 깊숙이 중첩된 이미지에서도 prop drilling 없이 라이트박스를
// 열 수 있도록 하는 아주 가벼운 이벤트 버스. useTheme.ts와 같은 패턴.

export type LightboxState = { src: string; alt: string; w: number; h: number } | null;

let state: LightboxState = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LightboxState {
  return state;
}

function getServerSnapshot(): LightboxState {
  return null;
}

export function useLightboxState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useLightbox() {
  const open = useCallback(
    (src: string, alt: string, w: number, h: number) => {
      state = { src, alt, w, h };
      notify();
    },
    []
  );
  const close = useCallback(() => {
    state = null;
    notify();
  }, []);
  return { open, close };
}
