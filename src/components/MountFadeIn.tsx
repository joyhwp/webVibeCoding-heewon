"use client";

import { useEffect, useState, type ReactNode } from "react";

type MountFadeInProps = {
  children: ReactNode;
  className?: string;
  /** 순차 등장 연출을 위한 시작 지연(초) */
  delay?: number;
};

/**
 * 페이지가 처음 열릴 때 한 번, 아래에서 위로 살짝 슬라이드되며 페이드인된다.
 * ScrollReveal(스크롤로 뷰포트에 들어올 때 반응)과 달리 스크롤 위치와
 * 무관하게 마운트 시 바로 실행된다 — home 탭 첫 진입 시 헤더 → Quick Add →
 * 타임라인 순으로 살짝 시차를 두고 등장시키는 용도로 쓴다.
 */
export default function MountFadeIn({
  children,
  className,
  delay = 0,
}: MountFadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
