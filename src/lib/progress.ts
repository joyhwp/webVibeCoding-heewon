// home 탭 "In Progress" 위젯의 데이터 레이어.
// schedule.ts(날짜별 할일)와는 별개로, 날짜에 묶이지 않는 "진행중인 것"들
// (프로젝트/강의/독서 등)을 하나의 localStorage 키에 배열로 저장한다.
// completedAt이 없으면 진행중(In Progress 위젯), 있으면 완료(아카이브)로
// 취급한다 — 완료 처리/되돌리기는 그냥 이 필드를 세팅/해제하는 것뿐이라
// 목록 간 이동에 별도 저장소가 필요 없다.

import type { TaskCategory } from "@/lib/taskCategory";

export type ProgressItem = {
  id: string;
  title: string;
  percent: number; // 0-100
  category: TaskCategory;
  /** DEAR Time으로 등록된 책 제목과 연결됐을 때만 (표시용) */
  bookTitle?: string;
  createdAt: number;
  updatedAt: number;
  /** 설정돼 있으면 완료(아카이브) 상태 */
  completedAt?: number;
};

const STORAGE_KEY = "progress:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function loadAll(): ProgressItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: ProgressItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** In Progress 위젯 목록 — 최근에 업데이트한 순 */
export function getActiveItems(): ProgressItem[] {
  return loadAll()
    .filter((i) => i.completedAt == null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 아카이브 목록 — 최근에 완료한 순 */
export function getArchivedItems(): ProgressItem[] {
  return loadAll()
    .filter((i) => i.completedAt != null)
    .sort((a, b) => (b.completedAt as number) - (a.completedAt as number));
}

export function addProgressItem(
  title: string,
  percent: number,
  category: TaskCategory,
  bookTitle?: string
): ProgressItem[] {
  const now = Date.now();
  const clamped = clampPercent(percent);
  const item: ProgressItem = {
    id: crypto.randomUUID(),
    title,
    percent: clamped,
    category,
    bookTitle,
    createdAt: now,
    updatedAt: now,
    completedAt: clamped >= 100 ? now : undefined,
  };
  saveAll([...loadAll(), item]);
  return getActiveItems();
}

/** 슬라이더/입력으로 진행률을 바꾼다. 100%가 되면 자동으로 완료(아카이브) 처리된다. */
export function setProgressPercent(id: string, percent: number): ProgressItem[] {
  const now = Date.now();
  const clamped = clampPercent(percent);
  const next = loadAll().map((i) =>
    i.id === id
      ? {
          ...i,
          percent: clamped,
          updatedAt: now,
          completedAt: clamped >= 100 ? now : undefined,
        }
      : i
  );
  saveAll(next);
  return next;
}

/** "완료" 버튼 — 진행률을 100으로 만들고 완료 처리한다 */
export function completeItem(id: string): ProgressItem[] {
  return setProgressPercent(id, 100);
}

/** 카드 인라인 수정 — 이름/카테고리(+연결된 책 제목)를 바꾼다. bookTitle을
 * undefined로 넘기면 책 연결이 끊어져서 수동 슬라이더로 전환된다. */
export function updateProgressItem(
  id: string,
  updates: { title?: string; category?: TaskCategory; bookTitle?: string }
): ProgressItem[] {
  const now = Date.now();
  const next = loadAll().map((i) =>
    i.id === id ? { ...i, ...updates, updatedAt: now } : i
  );
  saveAll(next);
  return next;
}

/** 아카이브에서 "진행중으로 되돌리기" — completedAt만 지운다 (진행률은 그대로 둬서,
 * 실수로 완료 처리한 경우 원래 값을 잃지 않는다) */
export function restoreItem(id: string): ProgressItem[] {
  const now = Date.now();
  const next = loadAll().map((i) =>
    i.id === id ? { ...i, completedAt: undefined, updatedAt: now } : i
  );
  saveAll(next);
  return next;
}

/** 아카이브에서 완전히 지우기 */
export function removeProgressItem(id: string): ProgressItem[] {
  const next = loadAll().filter((i) => i.id !== id);
  saveAll(next);
  return next;
}
