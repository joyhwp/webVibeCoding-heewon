// DEAR Time(독서) 기록 집계 레이어.
// schedule.ts에 날짜별로 흩어져 저장된 ScheduleItem 중 category === "dearTime"
// && book이 있는 항목들을 모아서, AddTaskForm의 "시작 페이지 자동완성"과
// study 탭의 Books 서브탭(책별 카드 + 히스토리)에서 쓴다.
// 별도의 저장 공간을 두지 않고 schedule.ts의 날짜별 데이터를 그때그때
// 다시 훑는 방식이라, 늘 최신 상태와 일치한다(동기화 문제 없음).

import { getIndexedDates, loadDay, type BookProgress } from "@/lib/schedule";

export type BookLogEntry = {
  dateKey: string;
  createdAt: number;
  title: string;
  startPage: number;
  endPage?: number;
};

export type BookSummary = {
  title: string;
  /** 지금까지 읽은 총 페이지 — 가장 최근(날짜 기준, 동률이면 등록 순서) 기록의
   * 종료 페이지(없으면 시작 페이지) */
  totalPages: number;
  lastReadDateKey: string;
  history: BookLogEntry[]; // 최신순
};

function isBrowser() {
  return typeof window !== "undefined";
}

/** 저장된 모든 날짜를 훑어 DEAR Time 독서 기록을 전부 모은다 (날짜 오름차순,
 * 같은 날이면 createdAt 오름차순은 보장 안 됨 — 정렬은 호출부에서). */
export function getAllBookLogs(): BookLogEntry[] {
  if (!isBrowser()) return [];
  const entries: BookLogEntry[] = [];
  for (const dateKey of getIndexedDates()) {
    for (const item of loadDay(dateKey)) {
      if (item.category !== "dearTime" || !item.book) continue;
      entries.push({
        dateKey,
        createdAt: item.createdAt,
        title: item.book.title,
        startPage: item.book.startPage,
        endPage: item.book.endPage,
      });
    }
  }
  return entries;
}

function compareRecency(a: BookLogEntry, b: BookLogEntry): number {
  // 날짜 내림차순, 같은 날이면 등록 시각 내림차순 (최신이 먼저)
  if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
  return b.createdAt - a.createdAt;
}

/** 이전에 한 번이라도 등록한 책 제목 목록 (최근 읽은 순). AddTaskForm의
 * 책 제목 자동완성 목록으로 쓴다. */
export function getKnownBookTitles(): string[] {
  const logs = getAllBookLogs().sort(compareRecency);
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const log of logs) {
    const key = log.title.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    titles.push(key);
  }
  return titles;
}

/** 주어진 책 제목으로 가장 최근에 등록된 기록의 종료 페이지를 반환한다
 * (없으면 시작 페이지, 기록 자체가 없으면 undefined). AddTaskForm이
 * "시작 페이지 = 이전 종료 페이지 + 1" 자동완성에 쓴다. 제목은
 * 대소문자/앞뒤 공백만 무시하고 정확히 일치해야 매칭된다. */
export function getLastPageForBook(title: string): number | undefined {
  const key = title.trim().toLowerCase();
  if (!key) return undefined;
  const matches = getAllBookLogs()
    .filter((log) => log.title.trim().toLowerCase() === key)
    .sort(compareRecency);
  const latest = matches[0];
  if (!latest) return undefined;
  return latest.endPage ?? latest.startPage;
}

/** 책별로 묶은 요약 — study 탭 Books 서브탭의 카드 목록에 쓴다
 * (마지막으로 읽은 날짜 최신순). */
export function getBookSummaries(): BookSummary[] {
  const logs = getAllBookLogs();
  const byTitle = new Map<string, BookLogEntry[]>();
  for (const log of logs) {
    const key = log.title.trim();
    if (!key) continue;
    const list = byTitle.get(key) ?? [];
    list.push(log);
    byTitle.set(key, list);
  }

  const summaries: BookSummary[] = [];
  for (const [title, history] of byTitle) {
    const sorted = [...history].sort(compareRecency);
    const latest = sorted[0];
    summaries.push({
      title,
      totalPages: latest.endPage ?? latest.startPage,
      lastReadDateKey: latest.dateKey,
      history: sorted,
    });
  }

  return summaries.sort((a, b) =>
    a.lastReadDateKey < b.lastReadDateKey
      ? 1
      : a.lastReadDateKey > b.lastReadDateKey
        ? -1
        : 0
  );
}

/** DEAR Time 항목의 표시용 제목 — "OO책 41~52쪽" (종료 페이지 없으면
 * "OO책 41쪽부터"). AddTaskForm이 저장 시 task 필드를 이 형태로 채운다. */
export function formatBookTask(book: BookProgress): string {
  return book.endPage != null
    ? `${book.title} ${book.startPage}~${book.endPage}쪽`
    : `${book.title} ${book.startPage}쪽부터`;
}
