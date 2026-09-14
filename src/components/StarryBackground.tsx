"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number; // 0~1 정규화된 위치 (그릴 때 캔버스 크기를 곱해서 씀)
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number; // ms 단위 시간에 곱해질 아주 작은 값 — 느긋한 반짝임 주기
  twinklePhase: number;
  isStreak: boolean; // 별똥별처럼 살짝 늘어진 얇은 선으로 그릴지
  streakLength: number;
  streakAngle: number;
};

const STAR_COUNT = 130;
const LAYER_OPACITY = 0.85; // 더 빛나 보이게 전체적으로 밝기를 올림
const DRIFT_PERIOD_MS = 26000; // 대각선으로 오가는 한 사이클 (거의 눈치 못 챌 정도로)
const DRIFT_AMPLITUDE_PX = 22;
const FRAME_INTERVAL_MS = 90; // ~11fps — 움직임이 원래 느려서 이 정도로도 충분히 부드럽고 훨씬 가볍다

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const isStreak = Math.random() < 0.12; // 일부만 별똥별 느낌의 짧은 선으로
    stars.push({
      x: Math.random(),
      y: Math.random(),
      radius:
        Math.random() < 0.85
          ? 0.6 + Math.random() * 1.2 // 대부분 1~2px 위주의 작은 점
          : 1.6 + Math.random() * 1.4, // 가끔 조금 더 큰 별
      baseAlpha: 0.5 + Math.random() * 0.6, // 전반적으로 더 밝게, 그래도 밝기 차는 유지
      twinkleSpeed: 0.00015 + Math.random() * 0.00035,
      twinklePhase: Math.random() * Math.PI * 2,
      isStreak,
      streakLength: 6 + Math.random() * 10,
      streakAngle: Math.PI / 4 + (Math.random() - 0.5) * 0.4, // 대략 대각선 방향
    });
  }
  return stars;
}

/**
 * 다크모드 전용 밤하늘 배경(캔버스, 라이브러리 없이 가볍게 구현).
 * - 별 100~150개를 랜덤 위치/크기로 흩뿌리고, 일부는 별똥별처럼 얇고 짧은
 *   선으로 그린다.
 * - 별마다 서로 다른 주기로 서서히 밝아졌다 어두워짐(twinkle).
 * - 별 전체가 아주 미세하게 대각선으로 오가며 흐르듯 움직인다(drift, ~26초 주기).
 * requestAnimationFrame 대신 ~11fps의 setInterval로 다시 그려서, 원래도 아주
 * 느린 움직임을 위해 배터리/CPU를 불필요하게 쓰지 않게 했다.
 */
export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>(createStars(STAR_COUNT));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 각 함수 안에서 다시 null 체크를 하는 건, 위에서 이미 걸러냈어도 TS가
    // 클로저 안까지는 그 좁혀진 타입을 따라오지 못하기 때문(둘 다 절대
    // null이 되진 않지만 타입상으로만 다시 확인해주는 것).
    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();

    function draw() {
      if (!ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const elapsed = reducedMotion ? 0 : performance.now() - startTime;

      // 전체 드리프트: 아주 미세한 폭으로 대각선을 오가는 사인 곡선
      const driftFactor = Math.sin((elapsed / DRIFT_PERIOD_MS) * Math.PI * 2);
      const offsetX = driftFactor * DRIFT_AMPLITUDE_PX;
      const offsetY = driftFactor * DRIFT_AMPLITUDE_PX * 0.6;

      ctx.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        const twinkle = reducedMotion
          ? 1
          : 0.6 +
            0.4 * Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase);
        const alpha = Math.max(0, Math.min(1, star.baseAlpha * twinkle));
        const x = star.x * w + offsetX;
        const y = star.y * h + offsetY;
        const glowColor = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.2).toFixed(3)})`;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        // 별 하나하나가 은은하게 빛나 보이도록 부드러운 광채(halo)를 준다 —
        // 밝은 별일수록, 큰 별일수록 광채도 더 넓게 퍼진다.
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = star.radius * 3 + alpha * 4;

        if (star.isStreak) {
          const dx = Math.cos(star.streakAngle) * star.streakLength;
          const dy = Math.sin(star.streakAngle) * star.streakLength;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = Math.max(0.5, star.radius * 0.6);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x - dx / 2, y - dy / 2);
          ctx.lineTo(x + dx / 2, y + dy / 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    }

    draw();
    // 접근성: 모션을 최소화하고 싶은 사용자에겐 한 번 정지된 화면만 그리고
    // 반짝임/드리프트 애니메이션 루프 자체를 돌리지 않는다.
    const interval = reducedMotion
      ? null
      : window.setInterval(draw, FRAME_INTERVAL_MS);

    return () => {
      window.removeEventListener("resize", resize);
      if (interval != null) window.clearInterval(interval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1, opacity: LAYER_OPACITY }}
    />
  );
}
