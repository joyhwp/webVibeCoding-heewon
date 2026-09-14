// "HH:mm" 문자열 ↔ 분(자정 기준) 변환 유틸. home 탭 타임라인 관련 컴포넌트에서 공용으로 사용.

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
