// 화면 어디서든(TimelineEntry, QuickAddBar, 캘린더 등) "삭제됨 · 되돌리기"
// 토스트를 띄울 수 있게 하는 아주 가벼운 전역 이벤트 버스.
// 실제 렌더링은 ToastContainer(레이아웃에 한 번만 마운트) 하나가 담당한다.

export type ToastState = {
  id: string;
  message: string;
  onUndo: () => void;
} | null;

const DURATION_MS = 5000;

let current: ToastState = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(state: ToastState) => void>();

function emit() {
  listeners.forEach((l) => l(current));
}

export function showUndoToast(message: string, onUndo: () => void) {
  if (hideTimer) clearTimeout(hideTimer);
  current = { id: crypto.randomUUID(), message, onUndo };
  emit();
  hideTimer = setTimeout(() => {
    current = null;
    emit();
  }, DURATION_MS);
}

export function dismissToast() {
  if (hideTimer) clearTimeout(hideTimer);
  current = null;
  emit();
}

export function subscribeToast(listener: (state: ToastState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastSnapshot(): ToastState {
  return current;
}

export const TOAST_DURATION_MS = DURATION_MS;
