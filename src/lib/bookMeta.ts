// 책의 "전체 페이지 수"(목표값) 저장소. 독서 기록(schedule.ts를 통해 쌓이는
// 세션별 시작~종료 페이지, lib/books.ts) 과 달리 이건 책 자체의 메타데이터라
// 완전히 별도로 관리한다 — AddTaskForm(DEAR Time 입력)에서는 안 묻고, Books
// 탭에서 필요할 때 한 번만 입력/수정한다. 책 제목을 key로 쓰는 단순한 맵.

const STORAGE_KEY = "bookMeta:v1";

type BookMetaMap = Record<string, { totalPages: number }>;

function isBrowser() {
  return typeof window !== "undefined";
}

function loadMap(): BookMetaMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMap(map: BookMetaMap) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
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
