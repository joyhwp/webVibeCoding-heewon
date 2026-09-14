// Books 탭 "Quotes" 섹션의 데이터 레이어. 책과 별개로 독립된 localStorage
// 배열에 저장한다 — 페이지 기록(schedule.ts)과 달리 날짜 버킷에 묶일 필요가
// 없는 단순한 목록이라서.

export type BookQuote = {
  id: string;
  bookTitle: string;
  content: string;
  page?: number;
  createdAt: number;
};

const STORAGE_KEY = "bookQuotes:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function loadAll(): BookQuote[] {
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

function saveAll(quotes: BookQuote[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

/** 최신순 */
export function getAllQuotes(): BookQuote[] {
  return loadAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function addQuote(
  bookTitle: string,
  content: string,
  page?: number
): BookQuote[] {
  const quote: BookQuote = {
    id: crypto.randomUUID(),
    bookTitle: bookTitle.trim(),
    content: content.trim(),
    page,
    createdAt: Date.now(),
  };
  saveAll([...loadAll(), quote]);
  return getAllQuotes();
}

export function removeQuote(id: string): BookQuote[] {
  const next = loadAll().filter((q) => q.id !== id);
  saveAll(next);
  return next;
}
