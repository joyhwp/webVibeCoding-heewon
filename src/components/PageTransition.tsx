"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const LEAVE_MS = 120; // 나가는 콘텐츠 페이드아웃 시간
// LEAVE_MS + 진입 애니메이션(css의 tab-transition-enter, 0.22s)을 합쳐
// 전체 전환이 대략 0.3초 안팎이 되도록 맞춤

export default function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"idle" | "leaving">("idle");

  // 렌더 중 경로 변화를 감지해 바로 "leaving" 단계로 전환한다.
  // (ref가 아닌 state만 사용하는, React가 권장하는 "렌더 중 상태 조정" 패턴)
  if (pathname !== activePath && phase === "idle") {
    setPhase("leaving");
  }

  // idle 상태(=전환 중이 아님)일 때만 최신 children을 계속 반영해서
  // 같은 탭 안에서의 상태 변화(할일 추가 등)가 즉시 보이게 한다.
  // leaving 동안엔 건드리지 않아 이전 탭의 마지막 모습이 그대로 유지된다.
  if (
    phase === "idle" &&
    pathname === activePath &&
    children !== displayChildren
  ) {
    setDisplayChildren(children);
  }

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => {
      setActivePath(pathname);
      setDisplayChildren(children);
      setPhase("idle");
    }, LEAVE_MS);
    return () => clearTimeout(timer);
    // pathname/children은 타이머가 발동하는 시점의 최신 값을 캡처해야 하므로
    // 의도적으로 의존성에서 제외(추가하면 leaving 도중 불필요하게 재실행됨)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div
      key={activePath}
      className={
        phase === "leaving" ? "tab-transition-leave" : "tab-transition-enter"
      }
    >
      {displayChildren}
    </div>
  );
}
