// Quick Add 자연어 파싱용 API Route.
//
// 브라우저에서 Claude API를 직접 호출하면 API 키가 노출되므로, 반드시 이
// 서버 사이드 Route Handler를 거쳐서만 호출한다. 프론트엔드(QuickAddBar,
// src/lib/llmTaskParser.ts)는 이 엔드포인트에 { text, today }만 보내고,
// 여기서 만든 시스템 프롬프트 + Claude API 호출 결과(JSON)만 그대로 돌려준다.
//
// 실패 시(네트워크 오류, rate limit, JSON 파싱 실패 등) 규칙 기반 폴백은
// 여기서 하지 않는다 — 이 Route는 항상 에러를 그대로 전달하고, 폴백은
// 호출부(src/lib/llmTaskParser.ts)가 기존 parseCommandText로 처리한다.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 요청마다 새로 만들지 않도록 모듈 스코프에서 한 번만 생성.
// 키가 없으면 client 생성 자체는 통과하고, 실제 호출 시점에 인증 에러가 난다 —
// 그래서 아래에서 명시적으로 한 번 더 키 존재를 확인해 더 명확한 에러를 준다.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 500;

const VALID_CATEGORIES = [
  "개인일정",
  "학교",
  "동아리",
  "과외 및 학원",
  "시험",
  "과제",
  "DEAR Time",
  "Study",
] as const;

function buildSystemPrompt(todayKey: string): string {
  const [y, m, d] = todayKey.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(y, m - 1, d).getDay()
  ];

  return `너는 사용자의 자연어 일정 입력을 구조화된 JSON으로 변환하는 파서다.

오늘 날짜는 ${todayKey} (${weekday}요일)이다. "내일", "모레", "다음주 화요일", "이번 주말" 같은
상대적 날짜 표현은 반드시 이 오늘 날짜를 기준으로 절대 날짜(YYYY-MM-DD)로 변환하라.

## intent (의도) 분류
다음 세 가지 중 하나로 분류하라:
- "add": 새 일정/할 일을 추가하는 경우
- "cancel": 기존 일정을 취소하거나 휴강시키는 경우
- "update": 기존 일정의 날짜/시간 등을 수정(변경, 이동)하는 경우

## category (카테고리) 분류
다음 중 하나로 분류하라: ${VALID_CATEGORIES.join(" / ")}
애매하거나 판단이 어려우면 기본값으로 "개인일정"을 사용하라.

## 날짜/시간 처리
- "~일부터 ~일까지"처럼 날짜 범위 표현이 있으면 여러 날에 걸친 종일(all-day) 이벤트로
  인식하고, date에는 시작일을, endDate에는 종료일을 넣어라.
- 시간 정보가 전혀 없으면 종일(all-day) 이벤트로 처리하고 isAllDay를 true로, startTime과
  endTime은 null로 하라.
- 시간 정보가 있으면 isAllDay는 false로 하고, 24시간제 "HH:mm" 형식으로 startTime(및
  있다면 endTime)을 채워라.
- 날짜 표현이 전혀 없으면 date는 null로 하라 (오늘로 임의 추정하지 마라).

## title (제목) 처리
날짜/시간을 나타내는 표현과 "있음", "해줘", "취소해줘" 같은 불필요한 어미/서술을 제거하고
핵심 내용만 남겨라. 예: "동아리 엠티 있음" → "동아리 엠티", "내일 수학 과제 제출 마감이야" → "수학 과제 제출"

## targetKeyword (매칭 대상 키워드)
intent가 "cancel" 또는 "update"일 때만 채워라. 사용자가 취소/수정하려는 기존 항목을
찾는 데 쓰일, 그 항목의 이름에 해당하는 핵심 키워드를 추출하라 (예: "운영체제 휴강" →
targetKeyword "운영체제"). intent가 "add"이면 targetKeyword는 null로 하라.

## 출력 형식
아래 JSON 스키마와 정확히 일치하는 JSON 객체 "하나만" 출력하라:

{
  "intent": "add" | "cancel" | "update",
  "title": string,
  "category": string,
  "date": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "startTime": "HH:mm" | null,
  "endTime": "HH:mm" | null,
  "isAllDay": boolean,
  "targetKeyword": string | null
}

이 JSON 객체 외의 그 어떤 텍스트도 절대 포함하지 마라 — 설명, 인사말, 코드블록 마커
(\`\`\`), 주석 등 무엇도 덧붙이지 말고 JSON만 출력하라.`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { text, today } = (body ?? {}) as { text?: unknown; today?: unknown };
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }
  if (typeof today !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return NextResponse.json({ error: "missing_today" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[parse-task] ANTHROPIC_API_KEY가 설정되지 않았습니다.");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(today),
      messages: [{ role: "user", content: text }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "empty_response" }, { status: 502 });
    }

    // 모델이 지시를 어기고 코드블록으로 감싸는 경우를 대비한 방어적 처리.
    const raw = textBlock.text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (jsonErr) {
      console.error("[parse-task] JSON 파싱 실패:", jsonErr, "raw:", raw);
      return NextResponse.json({ error: "invalid_json_from_model" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[parse-task] Claude API 인증 실패:", err.message);
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[parse-task] Claude API rate limit:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[parse-task] Claude API 오류 (${err.status}):`, err.message);
    } else {
      console.error("[parse-task] 알 수 없는 오류:", err);
    }
    return NextResponse.json({ error: "llm_call_failed" }, { status: 502 });
  }
}
