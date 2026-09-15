// 반복 수업(classSchedule.ts)의 원본 데이터는 건드리지 않고, 특정 날짜에
// 한해서만 "그날은 제외"시키기 위한 저장소. (휴강/수정으로 인한 이동 시 사용)
// 자연어 명령 파서(commandParser.ts) + QuickAddBar에서 사용.

import { readStore, writeStore } from "@/lib/storage";

// 키 이름은 스키마가 바뀌어도 고정한다 — 구조 변경은 키를 바꾸는 대신
// SCHEMA_VERSION을 올리고 MIGRATIONS에 변환 함수를 추가해서 처리한다.
const STORAGE_KEY = "classOverrides:v1";
const SCHEMA_VERSION = 1;
const MIGRATIONS: Array<(data: unknown) => unknown> = [(data) => data];

type Override = { dateKey: string; classId: string };

function readAll(): Override[] {
  return readStore<Override[]>(STORAGE_KEY, SCHEMA_VERSION, MIGRATIONS, () => []);
}

function writeAll(list: Override[]) {
  writeStore(STORAGE_KEY, SCHEMA_VERSION, list);
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
