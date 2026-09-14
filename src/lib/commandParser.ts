// 자유 텍스트 입력(QuickAddBar)에서 의도/날짜/시간/이름을 뽑아내는 순수 파서.
// localStorage 등 외부 상태는 전혀 건드리지 않는다 — 실제 데이터 조회/변경은
// QuickAddBar 컴포넌트가 이 파서의 결과를 받아서 처리한다.
//
// 정교한 자연어 이해가 아니라, 사용자가 명시한 키워드 기반 규칙(간단한
// 정규식 매칭)으로 동작한다. 애매하면 QuickAddBar가 확인/후보 선택 단계를
// 거치도록 설계돼 있어, 파싱이 완벽하지 않아도 안전하게 복구된다.

import type { TaskCategory } from "@/lib/taskCategory";

export type CommandIntent = "add" | "cancel" | "modify";

export type ParsedCommand =
  | {
      intent: "add";
      dateKey: string;
      /** 종일 멀티데이 일정일 때만: 종료 날짜("YYYY-MM-DD") */
      endDateKey?: string;
      /** 없으면 종일(all-day) 일정 */
      startTime?: string;
      endTime?: string;
      title: string;
      category: TaskCategory;
    }
  | {
      intent: "cancel" | "modify";
      dateKey: string; // 대상을 찾을 날짜
      nameFragment: string; // 이 문자열로 기존 항목을 검색
      newDateKey?: string; // modify일 때만: 새 날짜(없으면 날짜는 그대로)
      newStartTime?: string; // modify일 때만: 새 시작 시간(없으면 시간은 그대로)
      category: TaskCategory; // 새로 추가/이동될 항목에 쓸 추정 카테고리
    }
  | { intent: "unknown" };

const CANCEL_KEYWORDS = ["휴강", "취소", "쉼", "cancel", "cancelled"];
const MODIFY_KEYWORDS = [
  "변경",
  "수정",
  "옮기기",
  "옮겨",
  "바꿔",
  "바꾸",
  "change",
  "reschedule",
  "move",
];

const WEEKDAY_CHARS = ["일", "월", "화", "수", "목", "금", "토"]; // Date.getDay() 순서

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** 월요일을 0으로 하는 ISO 스타일 요일 인덱스 */
function isoIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function mondayOf(date: Date): Date {
  return addDays(date, -isoIndex(date));
}

function koreanWeekdayToIso(ch: string): number | null {
  const sundayBased = WEEKDAY_CHARS.indexOf(ch);
  if (sundayBased === -1) return null;
  return sundayBased === 0 ? 6 : sundayBased - 1;
}

type DateRangeMatch = { startDate: Date; endDate: Date; matchedText: string };

/**
 * "11일부터 12일까지", "9월 11일부터 9월 12일까지", "9월 11일부터 12일까지"
 * 같은 날짜 범위 표현을 찾는다. 단일 날짜보다 먼저 검사해야 한다.
 */
function extractDateRange(text: string, today: Date): DateRangeMatch | null {
  const m = text.match(
    /(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일\s*부터\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})\s*일\s*까지/
  );
  if (!m) return null;

  const startMonth = m[1] ? Number(m[1]) : today.getMonth() + 1;
  const startDay = Number(m[2]);
  const endMonth = m[3] ? Number(m[3]) : startMonth;
  const endDay = Number(m[4]);

  const startDate = new Date(today.getFullYear(), startMonth - 1, startDay);
  const endDate = new Date(today.getFullYear(), endMonth - 1, endDay);
  return { startDate, endDate, matchedText: m[0] };
}

type DateMatch = { date: Date; matchedText: string };

/** 텍스트에서 가장 먼저 발견되는 (범위가 아닌) 단일 날짜 표현 하나를 뽑아낸다 */
function extractDate(text: string, today: Date): DateMatch | null {
  if (/오늘/.test(text)) {
    return { date: today, matchedText: "오늘" };
  }
  if (/모레/.test(text)) {
    return { date: addDays(today, 2), matchedText: "모레" };
  }
  if (/내일/.test(text)) {
    return { date: addDays(today, 1), matchedText: "내일" };
  }

  const nextWeekMatch = text.match(/다음\s?주\s*([월화수목금토일])요?일?/);
  if (nextWeekMatch) {
    const iso = koreanWeekdayToIso(nextWeekMatch[1]);
    if (iso != null) {
      return {
        date: addDays(mondayOf(today), 7 + iso),
        matchedText: nextWeekMatch[0],
      };
    }
  }

  const thisWeekMatch = text.match(/이번\s?주\s*([월화수목금토일])요?일?/);
  if (thisWeekMatch) {
    const iso = koreanWeekdayToIso(thisWeekMatch[1]);
    if (iso != null) {
      return {
        date: addDays(mondayOf(today), iso),
        matchedText: thisWeekMatch[0],
      };
    }
  }

  const bareWeekdayMatch = text.match(/([월화수목금토일])요일/);
  if (bareWeekdayMatch) {
    const iso = koreanWeekdayToIso(bareWeekdayMatch[1]);
    if (iso != null) {
      let target = addDays(mondayOf(today), iso);
      if (target < today) target = addDays(target, 7);
      return { date: target, matchedText: bareWeekdayMatch[0] };
    }
  }

  const explicitMonthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (explicitMonthDay) {
    const month = Number(explicitMonthDay[1]);
    const day = Number(explicitMonthDay[2]);
    const date = new Date(today.getFullYear(), month - 1, day);
    return { date, matchedText: explicitMonthDay[0] };
  }

  const slashDate = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (slashDate) {
    const month = Number(slashDate[1]);
    const day = Number(slashDate[2]);
    const date = new Date(today.getFullYear(), month - 1, day);
    return { date, matchedText: slashDate[0] };
  }

  return null;
}

function hourWithMeridiem(
  hour: number,
  meridiem: string | undefined
): number {
  if (meridiem === "오후" && hour < 12) return hour + 12;
  if (meridiem === "오전" && hour === 12) return 0;
  if (!meridiem && hour >= 1 && hour <= 6) {
    // 오전/오후가 명시되지 않은 경우의 실용적인 추정:
    // 1~6시는 보통 오후, 7~11시는 보통 오전을 가리키는 경우가 많다.
    return hour + 12;
  }
  return hour;
}

type TimeRangeMatch = {
  startTime: string;
  endTime?: string;
  matchedText: string;
};

/**
 * "1시부터 4시까지", "오후 1시부터 4시까지", "13:00부터 15:00까지" 같은
 * 시간 범위를 먼저 찾고, 없으면 "오후 3시" 같은 단일 시각을 찾는다.
 */
function extractTime(text: string): TimeRangeMatch | null {
  const range = text.match(
    /(오전|오후)?\s*(\d{1,2})(?::([0-5]\d))?\s*시?\s*부터\s*(오전|오후)?\s*(\d{1,2})(?::([0-5]\d))?\s*시?\s*까지/
  );
  if (range) {
    const startHour = hourWithMeridiem(Number(range[2]), range[1]);
    const startMin = range[3] ? Number(range[3]) : 0;
    const endHour = hourWithMeridiem(Number(range[5]), range[4] ?? range[1]);
    const endMin = range[6] ? Number(range[6]) : 0;
    return {
      startTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
      endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
      matchedText: range[0],
    };
  }

  const hhmm = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (hhmm) {
    const h = String(Number(hhmm[1])).padStart(2, "0");
    return { startTime: `${h}:${hhmm[2]}`, matchedText: hhmm[0] };
  }

  const korean = text.match(/(오전|오후)?\s*(\d{1,2})\s*시\s*(\d{1,2})?\s*분?/);
  if (korean) {
    const hour = hourWithMeridiem(Number(korean[2]), korean[1]);
    const minute = korean[3] ? Number(korean[3]) : 0;
    return {
      startTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      matchedText: korean[0],
    };
  }

  return null;
}

const CATEGORY_KEYWORDS: [RegExp, TaskCategory][] = [
  [/시험|퀴즈|중간고사|기말고사|exam|quiz/i, "exam"],
  [/과제|리포트|레포트|숙제|assignment|homework/i, "assignment"],
  [/동아리|동방|club/i, "club"],
  [/학원|과외|tutoring/i, "tutoring"],
  [/자습|복습|스터디|study/i, "study"],
  [/수업|강의|휴강|학교|school|class/i, "school"],
];

function inferCategory(text: string): TaskCategory {
  for (const [re, category] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return category;
  }
  return "personal";
}

function detectIntent(text: string): CommandIntent {
  if (CANCEL_KEYWORDS.some((k) => text.includes(k))) return "cancel";
  if (MODIFY_KEYWORDS.some((k) => text.includes(k))) return "modify";
  return "add";
}

const TRAILING_PARTICLES =
  /(으로|로|에서|에게|에는|에|은|는|이|가|을|를|와|과|하고)$/;
const TRAILING_FILLER =
  /(할\s?예정|있음|있어요|있어|이에요|예요|이야|해줘|해주세요|줘|주세요|부탁해|부탁|please)$/i;

/** 날짜/시간/의도 키워드로 매칭된 부분을 걷어내고 남은 조각을 정리 */
function stripAndTrim(text: string, remove: string[]): string {
  let result = text;
  for (const chunk of remove) {
    if (chunk) result = result.replace(chunk, " ");
  }
  const keywordsToStrip = [...CANCEL_KEYWORDS, ...MODIFY_KEYWORDS];
  for (const kw of keywordsToStrip) {
    result = result.replaceAll(kw, " ");
  }
  result = result.replace(/\s+/g, " ").trim();
  // 흔한 조사/맺음말을 양 끝에서 반복적으로 제거
  for (let i = 0; i < 4; i++) {
    const before = result;
    result = result.replace(TRAILING_FILLER, "").trim();
    result = result.replace(TRAILING_PARTICLES, "").trim();
    if (result === before) break;
  }
  return result.trim();
}

export function parseCommandText(
  rawText: string,
  today: Date = new Date()
): ParsedCommand {
  const text = rawText.trim();
  if (!text) return { intent: "unknown" };

  const intent = detectIntent(text);
  const rangeMatch = extractDateRange(text, today);
  const dateMatch = rangeMatch ? null : extractDate(text, today);
  const timeMatch = extractTime(text);
  const dateKey = toDateKey(rangeMatch?.startDate ?? dateMatch?.date ?? today);
  const category = inferCategory(text);

  const dateMatchedText = rangeMatch?.matchedText ?? dateMatch?.matchedText ?? "";

  if (intent === "add") {
    const title = stripAndTrim(text, [
      dateMatchedText,
      timeMatch?.matchedText ?? "",
    ]);
    if (!title) return { intent: "unknown" };

    const endDateKey = rangeMatch ? toDateKey(rangeMatch.endDate) : undefined;

    return {
      intent: "add",
      dateKey,
      endDateKey: endDateKey && endDateKey !== dateKey ? endDateKey : undefined,
      startTime: timeMatch?.startTime,
      endTime: timeMatch?.endTime,
      title,
      category,
    };
  }

  // cancel / modify: 남은 조각이 검색용 "이름"이 된다.
  const nameFragment = stripAndTrim(text, [
    dateMatchedText,
    timeMatch?.matchedText ?? "",
  ]);

  if (intent === "cancel") {
    if (!nameFragment) return { intent: "unknown" };
    return { intent: "cancel", dateKey, nameFragment, category };
  }

  // modify: 새 날짜/시간이 언급됐을 수 있음 — 원래 항목을 찾을 날짜는
  // "오늘" 등 기준일 그대로 두고(대개 오늘 기준으로 말하는 경우가 많음),
  // 새로 파싱된 날짜/시간은 이동 대상으로 사용한다.
  if (!nameFragment) return { intent: "unknown" };
  return {
    intent: "modify",
    dateKey: toDateKey(today),
    nameFragment,
    newDateKey: rangeMatch || dateMatch ? dateKey : undefined,
    newStartTime: timeMatch?.startTime,
    category,
  };
}
