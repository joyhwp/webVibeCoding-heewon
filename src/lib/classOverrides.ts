// 반복 수업(classSchedule.ts)의 원본 데이터는 건드리지 않고, 특정 날짜에
// 한해서만 "그날은 제외"시키기 위한 저장소. (휴강/수정으로 인한 이동 시 사용)
// 자연어 명령 파서(commandParser.ts) + QuickAddBar에서 사용.

const STORAGE_KEY = "classOverrides:v1";

type Override = { dateKey: string; classId: string };

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Override[] {
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

function writeAll(list: Override[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isClassCancelled(dateKey: string, classId: string): boolean {
  return readAll().some(
    (o) => o.dateKey === dateKey && o.classId === classId
  );
}

export function cancelClassForDate(dateKey: string, classId: string) {
  const all = readAll();
  if (!all.some((o) => o.dateKey === dateKey && o.classId === classId)) {
    writeAll([...all, { dateKey, classId }]);
  }
}

export function uncancelClassForDate(dateKey: string, classId: string) {
  writeAll(
    readAll().filter((o) => !(o.dateKey === dateKey && o.classId === classId))
  );
}
