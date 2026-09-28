"use client";

import { useCallback, useSyncExternalStore } from "react";

// v1은 만료 없이 "unlocked" 문자열만 저장해서 한 번 뚫으면 영구적으로
// 다시 묻지 않는 버그가 있었다. v2는 만료 시각(ms epoch)을 같이 저장한다.
const STORAGE_KEY = "dashboardAuth:v2";
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30일 — 필요하면 이 값만 조정

type StoredAuth = { expiresAt: number };

function readUnlocked(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.expiresAt !== "number" || Date.now() >= parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
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

// 다른 탭/창에서 잠금 상태가 바뀌면(다른 탭에서 인증하거나, storage를
// 수동으로 지운 경우) 이 탭도 새로고침 없이 즉시 반영되도록 동기화한다.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cached = readUnlocked();
      notify();
    }
  });
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
      const expiresAt = Date.now() + REMEMBER_MS;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ expiresAt } satisfies StoredAuth)
      );
    } catch {
      // localStorage를 못 쓰는 환경이어도 최소한 이번 세션 동안은 통과시킨다
    }
    cached = true;
    notify();
  }, []);

  return { unlocked, unlock };
}
