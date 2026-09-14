"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { useUnlocked } from "@/hooks/useUnlocked";

// 보안 목적이 아니라 가벼운 접근 차단용이라 코드에 그대로 둔다.
const CORRECT_PASSWORD = "00";

/**
 * 사이트 전체를 가리는 아주 단순한 비밀번호 게이트.
 * 잠긴 동안은 children을 아예 렌더링하지 않는다 — 대시보드 어떤 부분도
 * 화면에 나오거나 데이터를 읽지 않는다. 한 번 맞히면 localStorage에 저장해서
 * 재방문 시 다시 묻지 않는다(useUnlocked 훅, useTheme.ts와 같은 SSR 안전 패턴).
 */
export default function PasswordGate({ children }: { children: ReactNode }) {
  const { unlocked, unlock } = useUnlocked();
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      unlock();
      return;
    }
    setInput("");
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard
          className={`w-full max-w-xs text-center ${
            shake ? "animate-[shake_0.4s_ease-in-out]" : ""
          }`}
        >
          <p className="mb-4 text-sm font-medium text-foreground/70">
            Enter password to continue
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              aria-label="Password"
              className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-center text-sm tracking-widest outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            />
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Enter
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
}
