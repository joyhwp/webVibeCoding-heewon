"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dashboardAuth:v1";

function readUnlocked(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "unlocked";
  } catch {
    return false;
  }
}

// useTheme.ts와 같은 패턴 — 여러 컴포넌트가 동시에 useUnlocked()를 쓸 일은
// 없지만, useSyncExternalStore가 요구하는 subscribe/getSnapshot 계약을
// 그대로 따라서 unlock() 직후 리렌더가 확실히 일어나게 한다.
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let cached: boolean | null = null;
function getSnapshot(): boolean {
  if (cached == null) cached = readUnlocked();
  return cached;
}

// 서버에는 localStorage가 없으므로 항상 "잠김"으로 본다 — 실제 값은
// 하이드레이션 직후 클라이언트에서만 확인한다(PasswordGate가 그동안
// 잠금 화면을 그려 하이드레이션 불일치를 막는다).
function getServerSnapshot(): boolean {
  return false;
}

/** 사이트 비밀번호 게이트(PasswordGate.tsx)의 잠금 상태. */
export function useUnlocked() {
  const unlocked = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const unlock = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "unlocked");
    } catch {
      // localStorage를 못 쓰는 환경이어도 최소한 이번 세션 동안은 통과시킨다
    }
    cached = true;
    notify();
  }, []);

  return { unlocked, unlock };
}
