// Quick Add 자연어 파싱의 새 진입점.
//
// 1) 먼저 /api/parse-task(서버 사이드에서 Claude API를 호출하는 Route Handler)를
//    통해 LLM 기반으로 파싱을 시도한다.
// 2) 네트워크 오류, rate limit, 응답 스키마 불일치 등 어떤 이유로든 실패하면
//    기존 규칙 기반 파서(commandParser.ts의 parseCommandText)로 조용히
//    폴백한다 — 기존 로직은 전혀 수정하지 않고 그대로 백업용으로 재사용한다.
//
// QuickAddBar는 이 모듈의 parseQuickAddText()만 호출하면 되고, 결과 타입은
// 기존과 동일한 ParsedCommand이므로 이후 확인 화면/후보 선택 로직은 그대로 쓴다.

import { parseCommandText, type ParsedCommand } from "@/lib/commandParser";
import type { TaskCategory } from "@/lib/taskCategory";

const CATEGORY_LABEL_TO_VALUE: Record<string, TaskCategory> = {
  개인일정: "personal",
  학교: "school",
  동아리: "club",
  "과외 및 학원": "tutoring",
  시험: "exam",
  과제: "assignment",
  "DEAR Time": "dearTime",
  Study: "study",
};

function toCategory(label: unknown): TaskCategory {
  if (typeof label === "string" && label in CATEGORY_LABEL_TO_VALUE) {
    return CATEGORY_LABEL_TO_VALUE[label];
  }
  return "personal";
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function asDateKey(value: unknown): string | undefined {
  return typeof value === "string" && DATE_KEY_RE.test(value) ? value : undefined;
}

function asTime(value: unknown): string | undefined {
  return typeof value === "string" && TIME_RE.test(value) ? value : undefined;
}

/**
 * API Route가 돌려준 원시 JSON을 검증하면서 기존 ParsedCommand 형태로 변환한다.
 * 스키마를 벗어나는 값을 만나면 예외를 던져서, 호출부가 규칙 기반 폴백으로
 * 넘어가게 한다 (LLM 응답을 신뢰할 수 없을 때 잘못된 일정이 만들어지는 것보다
 * 안전하게 폴백하는 쪽이 낫다).
 */
function normalizeLlmResult(raw: unknown, todayKey: string): ParsedCommand {
  if (!raw || typeof raw !== "object") throw new Error("invalid_shape");
  const r = raw as Record<string, unknown>;

  if (r.intent !== "add" && r.intent !== "cancel" && r.intent !== "update") {
    throw new Error("invalid_intent");
  }
  if (typeof r.title !== "string" || !r.title.trim()) {
    throw new Error("invalid_title");
  }

  const category = toCategory(r.category);
  const dateKey = asDateKey(r.date) ?? todayKey;
  const startTimeRaw = asTime(r.startTime);
  // isAllDay가 boolean으로 안 오면, startTime 유무로부터 안전하게 유추한다.
  const isAllDay = typeof r.isAllDay === "boolean" ? r.isAllDay : !startTimeRaw;
  const startTime = isAllDay ? undefined : startTimeRaw;
  const endTime = isAllDay ? undefined : asTime(r.endTime);
  const title = r.title.trim();

  if (r.intent === "add") {
    const endDateKey = asDateKey(r.endDate);
    return {
      intent: "add",
      dateKey,
      endDateKey: endDateKey && endDateKey !== dateKey ? endDateKey : undefined,
      startTime,
      endTime,
      title,
      category,
    };
  }

  // cancel / update: 기존 항목을 찾을 키워드 (없으면 제목을 그대로 사용)
  const nameFragment =
    typeof r.targetKeyword === "string" && r.targetKeyword.trim()
      ? r.targetKeyword.trim()
      : title;

  if (r.intent === "cancel") {
    return { intent: "cancel", dateKey, nameFragment, category };
  }

  // update -> 기존 ParsedCommand의 "modify"에 대응.
  // 규칙 기반 파서와 같은 관례를 따라 원래 항목은 오늘 날짜에서 검색하고,
  // LLM이 뽑아낸 날짜/시간은 "새로 옮길 대상"으로 사용한다.
  return {
    intent: "modify",
    dateKey: todayKey,
    nameFragment,
    newDateKey: asDateKey(r.date),
    newStartTime: startTime,
    category,
  };
}

async function callParseTaskApi(text: string, todayKey: string): Promise<unknown> {
  const res = await fetch("/api/parse-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, today: todayKey }),
  });
  if (!res.ok) {
    throw new Error(`/api/parse-task failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Quick Add 입력을 구조화된 ParsedCommand로 변환한다.
 * LLM 기반 파싱을 먼저 시도하고, 실패하면 규칙 기반 parseCommandText로 폴백한다.
 */
export async function parseQuickAddText(
  text: string,
  today: Date
): Promise<ParsedCommand> {
  const todayKey = toDateKey(today);
  try {
    const raw = await callParseTaskApi(text, todayKey);
    return normalizeLlmResult(raw, todayKey);
  } catch (err) {
    console.warn(
      "[quick-add] LLM 파싱 실패, 규칙 기반 파서로 폴백합니다:",
      err
    );
    return parseCommandText(text, today);
  }
}
