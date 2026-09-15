// 책의 "전체 페이지 수"(목표값) 저장소. 독서 기록(schedule.ts를 통해 쌓이는
// 세션별 시작~종료 페이지, lib/books.ts) 과 달리 이건 책 자체의 메타데이터라
// 완전히 별도로 관리한다 — AddTaskForm(DEAR Time 입력)에서는 안 묻고, Books
// 탭에서 필요할 때 한 번만 입력/수정한다. 책 제목을 key로 쓰는 단순한 맵.

import { readStore, writeStore } from "@/lib/storage";

// 키 이름은 스키마가 바뀌어도 고정한다 — 구조 변경은 키를 바꾸는 대신
// SCHEMA_VERSION을 올리고 MIGRATIONS에 변환 함수를 추가해서 처리한다.
const STORAGE_KEY = "bookMeta:v1";
const SCHEMA_VERSION = 1;
const MIGRATIONS: Array<(data: unknown) => unknown> = [(data) => data];

type BookMetaMap = Record<string, { totalPages: number }>;

function loadMap(): BookMetaMap {
  return readStore<BookMetaMap>(STORAGE_KEY, SCHEMA_VERSION, MIGRATIONS, () => ({}));
}

function saveMap(map: BookMetaMap) {
  writeStore(STORAGE_KEY, SCHEMA_VERSION, map);
}

/** 책 제목(대소문자/공백 무시)으로 등록된 전체 페이지 수를 가져온다 — 없으면 undefined */
export function getTotalPages(title: string): number | undefined {
  return loadMap()[title.trim().toLowerCase()]?.totalPages;
}

export function setTotalPages(title: string, totalPages: number) {
  const map = loadMap();
  map[title.trim().toLowerCase()] = { totalPages: Math.max(1, Math.round(totalPages)) };
  saveMap(map);
}
