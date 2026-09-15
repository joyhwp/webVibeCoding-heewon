// 삭제된 할일 / 수업 휴강을 30일간 보관하는 휴지통.
// 실제 삭제(hard delete)는 여기서 원본 데이터를 지운 뒤, 복구에 필요한
// 정보를 이 저장소(localStorage: trash:v1)에 남겨두는 방식으로 구현한다.

import { removeItem, restoreItem, type ScheduleItem } from "@/lib/schedule";
import { cancelClassForDate, uncancelClassForDate } from "@/lib/classOverrides";
import type { TaskCategory } from "@/lib/taskCategory";
import { readStore, writeStore } from "@/lib/storage";

export type TrashEntry =
  | {
      id: string;
      kind: "task";
      deletedAt: number;
      dateKey: string;
      item: ScheduleItem;
    }
  | {
      id: string;
      kind: "class-cancel";
      deletedAt: number;
      dateKey: string;
      classId: string;
      subject: string;
      room?: string;
      startTime: string;
      endTime: string;
      category: TaskCategory;
    };

// 키 이름은 스키마가 바뀌어도 고정한다 — 구조 변경은 키를 바꾸는 대신
// SCHEMA_VERSION을 올리고 MIGRATIONS에 변환 함수를 추가해서 처리한다.
const STORAGE_KEY = "trash:v1";
const SCHEMA_VERSION = 1;
const MIGRATIONS: Array<(data: unknown) => unknown> = [(data) => data];
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30일

function readAllRaw(): TrashEntry[] {
  return readStore<TrashEntry[]>(STORAGE_KEY, SCHEMA_VERSION, MIGRATIONS, () => []);
}

function writeAll(entries: TrashEntry[]) {
  writeStore(STORAGE_KEY, SCHEMA_VERSION, entries);
}

/** 30일 지난 항목은 조회 시점에 걸러내고 완전히 지운 뒤 반환(최신순) */
export function getTrash(): TrashEntry[] {
  const all = readAllRaw();
  const now = Date.now();
  const fresh = all.filter((e) => now - e.deletedAt < RETENTION_MS);
  if (fresh.length !== all.length) writeAll(fresh);
  return [...fresh].sort((a, b) => b.deletedAt - a.deletedAt);
}

export function moveTaskToTrash(dateKey: string, item: ScheduleItem): string {
  removeItem(dateKey, item.id);
  const trashId = crypto.randomUUID();
  writeAll([
    ...readAllRaw(),
    { id: trashId, kind: "task", deletedAt: Date.now(), dateKey, item },
  ]);
  return trashId;
}

export function moveClassCancelToTrash(
  dateKey: string,
  classId: string,
  subject: string,
  startTime: string,
  endTime: string,
  room?: string
): string {
  cancelClassForDate(dateKey, classId);
  const trashId = crypto.randomUUID();
  writeAll([
    ...readAllRaw(),
    {
      id: trashId,
      kind: "class-cancel",
      deletedAt: Date.now(),
      dateKey,
      classId,
      subject,
      room,
      startTime,
      endTime,
      category: "school",
    },
  ]);
  return trashId;
}

/** 특정 날짜/수업의 휴강 처리에 해당하는 휴지통 항목 id를 찾는다.
 * 타임라인/캘린더에서 휴강된 수업을 클릭해 바로 복구할 때, restoreFromTrash에
 * 넘길 id를 알아내는 용도(찾으면 undo 토스트를 눌렀을 때와 동일하게 복구됨). */
export function findClassCancelTrashId(
  dateKey: string,
  classId: string
): string | undefined {
  return getTrash().find(
    (e) => e.kind === "class-cancel" && e.dateKey === dateKey && e.classId === classId
  )?.id;
}

/** 복구: 원래 자리로 되돌리고 휴지통에서 제거 */
export function restoreFromTrash(trashId: string) {
  const all = readAllRaw();
  const entry = all.find((e) => e.id === trashId);
  if (!entry) return;

  if (entry.kind === "task") {
    restoreItem(entry.dateKey, entry.item);
  } else {
    uncancelClassForDate(entry.dateKey, entry.classId);
  }
  writeAll(all.filter((e) => e.id !== trashId));
}

/** 완전 삭제: 휴지통에서만 제거(원본은 이미 지워진 상태) */
export function permanentlyDelete(trashId: string) {
  writeAll(readAllRaw().filter((e) => e.id !== trashId));
}
