"use client";

import { useSyncExternalStore } from "react";
import {
  dismissToast,
  getToastSnapshot,
  subscribeToast,
  TOAST_DURATION_MS,
} from "@/lib/toastBus";

function getServerSnapshot() {
  return null;
}

export default function ToastContainer() {
  const toast = useSyncExternalStore(
    subscribeToast,
    getToastSnapshot,
    getServerSnapshot
  );

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <div
        key={toast.id}
        className="glass-panel pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full py-2.5 pl-4 pr-2 shadow-lg"
        style={{ animation: "toast-in 0.25s ease-out both" }}
      >
        <span className="text-sm text-foreground">{toast.message}</span>
        <button
          type="button"
          onClick={() => {
            toast.onUndo();
            dismissToast();
          }}
          className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss"
          className="rounded-full px-1.5 text-foreground/40 hover:text-foreground/70"
        >
          ✕
        </button>
        <span
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500/60"
          style={{
            animation: `toast-countdown ${TOAST_DURATION_MS}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
