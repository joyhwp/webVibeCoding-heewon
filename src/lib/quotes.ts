// Books 탭 "Quotes" 섹션의 데이터 레이어. 책과 별개로 독립된 localStorage
// 배열에 저장한다 — 페이지 기록(schedule.ts)과 달리 날짜 버킷에 묶일 필요가
// 없는 단순한 목록이라서.

import { readStore, writeStore } from "@/lib/storage";

export type BookQuote = {
  id: string;
  bookTitle: string;
  content: string;
  page?: number;
  createdAt: number;
};

// 키 이름은 스키마가 바뀌어도 고정한다 — 구조 변경은 키를 바꾸는 대신
// SCHEMA_VERSION을 올리고 MIGRATIONS에 변환 함수를 추가해서 처리한다.
const STORAGE_KEY = "bookQuotes:v1";
const SCHEMA_VERSION = 1;
const MIGRATIONS: Array<(data: unknown) => unknown> = [(data) => data];

function loadAll(): BookQuote[] {
  return readStore<BookQuote[]>(STORAGE_KEY, SCHEMA_VERSION, MIGRATIONS, () => []);
}

function saveAll(quotes: BookQuote[]) {
  writeStore(STORAGE_KEY, SCHEMA_VERSION, quotes);
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
