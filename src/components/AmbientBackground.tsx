"use client";

import { useTheme } from "@/hooks/useTheme";
import StarryBackground from "@/components/StarryBackground";
import CloudBackground from "@/components/CloudBackground";

/**
 * 사이트 전체 배경 — 라이트모드는 낮 하늘(구름), 다크모드는 별이 떠 있는
 * 밤하늘로 테마가 짝을 이룬다. useTheme()이 SSR에서는 항상 "light"를
 * 반환하므로 최초 렌더는 구름 쪽이고, 하이드레이션 직후 실제 테마가 dark면
 * 별 배경으로 바로 전환된다(ThemeToggle과 동일한 패턴).
 */
export default function AmbientBackground() {
  const { theme } = useTheme();
  if (theme === "dark") return <StarryBackground />;
  return <CloudBackground />;
}
