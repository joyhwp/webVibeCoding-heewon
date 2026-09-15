// localStorage에 저장하는 모든 데이터 레이어가 같이 쓰는 안전한 읽기/쓰기 +
// 스키마 버전 관리 유틸.
//
// 원칙: 데이터 구조가 바뀌어도 localStorage 키 이름은 절대 바꾸지 않는다.
// 대신 저장하는 값 안에 스키마 버전을 같이 넣어두고({ v, data } 형태), 읽을
// 때 저장된 버전이 지금 코드가 기대하는 버전보다 낮으면 migrations를
// 순서대로 적용해서 최신 구조로 변환한다 — 그래서 필드를 추가/변경해도
// 브라우저에 이미 저장된 옛날 데이터가 사라지지 않는다.
//
// 이 유틸이 생기기 전부터 있던 값들(버전 정보 없이 배열/객체를 그대로
// 저장한 것)은 "버전 0"으로 취급해서 그대로 migrations[0]부터 태운다.

type Envelope<T> = { v: number; data: T };

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { v?: unknown }).v === "number" &&
    "data" in value
  );
}

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * key로 저장된 값을 읽어 version(현재 코드가 기대하는 스키마 버전)에 맞춰
 * 반환한다. migrations[n]은 "버전 n의 데이터"를 받아 "버전 n+1의 데이터"로
 * 변환해야 한다 — 즉 migrations.length는 항상 version과 같아야 한다.
 * 값이 없거나 파싱에 실패하면 fallback()을 쓴다.
 */
export function readStore<T>(
  key: string,
  version: number,
  migrations: Array<(data: unknown) => unknown>,
  fallback: () => T
): T {
  if (!isBrowser()) return fallback();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    const parsed: unknown = JSON.parse(raw);

    let v: number;
    let data: unknown;
    if (isEnvelope(parsed)) {
      v = parsed.v;
      data = parsed.data;
    } else {
      // 버전 정보 없이 저장된 예전 데이터
      v = 0;
      data = parsed;
    }

    for (let i = v; i < version; i++) {
      data = migrations[i](data);
    }
    return data as T;
  } catch {
    return fallback();
  }
}

/** key에 현재 스키마 버전과 함께 데이터를 저장한다. */
export function writeStore<T>(key: string, version: number, data: T) {
  if (!isBrowser()) return;
  const envelope: Envelope<T> = { v: version, data };
  window.localStorage.setItem(key, JSON.stringify(envelope));
}

/** key를 완전히 지운다(항목이 하나도 안 남았을 때 등). */
export function removeStore(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}
