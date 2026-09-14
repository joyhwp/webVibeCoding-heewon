"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // 구독할 대상이 없는, 마운트 여부만 알려주는 외부 스토어이므로 no-op
  return () => {};
}

/**
 * 서버 렌더링/최초 하이드레이션 시엔 항상 false를 반환하고,
 * 하이드레이션이 끝난 뒤에는 true를 반환한다.
 * localStorage처럼 서버에 존재하지 않는 값을 다루는 컴포넌트에서
 * 하이드레이션 불일치(hydration mismatch)를 막기 위해 사용.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
