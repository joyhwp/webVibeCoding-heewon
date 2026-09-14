"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLightbox, useLightboxState } from "@/lib/lightboxBus";
import { useHasMounted } from "@/hooks/useHasMounted";

/** study 페이지 최상단에 한 번만 렌더 — 어디서 열리든 이미지를 확대해서 보여준다 */
export default function LightboxRoot() {
  const state = useLightboxState();
  const { close } = useLightbox();
  const mounted = useHasMounted();

  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [state, close]);

  if (!mounted || !state) return null;

  // TabNav(header, z-50, sticky)와 같은 상위 stacking context 밖으로 확실히
  // 빠져나가도록 body에 직접 포탈 — 안 그러면 sticky 헤더가 라이트박스 위로
  // 그려지는 경우가 있었다(실제로 겪은 버그).
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/92 p-6 backdrop-blur-md"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={close}
        aria-label="닫기"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
      >
        ✕
      </button>
      <figure className="flex max-h-full max-w-full flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.src}
          alt={state.alt}
          className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        {state.alt && (
          <figcaption className="max-w-prose text-center text-sm text-white/80">
            {state.alt}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
  );
}
