// 학교 시간표 — 요일별로 매주 반복되는 일정.
// 매일 자정 초기화되는 home 탭 할일(schedule.ts)과는 별도의 저장소(localStorage
// key: classSchedule:v4)에서 관리한다. 최초 실행 시 시간표 사진에서 추출한
// 데이터로 시드(seed)되고, 이후에는 localStorage에 있는 값을 그대로 쓴다 —
// 즉 이 파일의 SEED_CLASSES를 고칠 때마다, 이미 시드된 브라우저에도 반영되게
// 하려면 아래 STORAGE_KEY 버전을 반드시 같이 올려야 한다(빼먹으면 화면에
// 예전 값이 계속 남는다 — 실제로 한 번 겪은 버그라 꼭 지킬 것).
// (v1 → v2: 실제 강의 시간에 맞게 시각 보정. v2 → v3: 그 시각 보정이 실제로는
// 반영 안 된 채 남아있던 브라우저들이 있어서 강제 재시드. v3 → v4: 수요일
// 저녁 학원 조교 일정 추가)

import { isClassCancelled } from "@/lib/classOverrides";

export type ClassSession = {
  id: string;
  day: number; // Date.getDay() 기준: 0=일 1=월 2=화 3=수 4=목 5=금 6=토
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  subject: string;
  professor?: string;
  room: string;
  /** getClassesForDay(day, dateKey)에서만 채워짐: 그 날짜에 한해 휴강 처리됐는지.
   * 원본 반복 시간표 데이터 자체에는 저장되지 않는, 조회 시점의 파생 값이다. */
  cancelled?: boolean;
};

const STORAGE_KEY = "classSchedule:v4";

const MON = 1;
const TUE = 2;
const WED = 3;
const THU = 4;
const FRI = 5;

// 첨부한 시간표 사진(everytime)에서 추출한 데이터
const SEED_CLASSES: Omit<ClassSession, "id">[] = [
  {
    day: TUE,
    startTime: "09:00",
    endTime: "10:15",
    subject: "논리설계",
    professor: "이숙윤",
    room: "애기능생활관 301호",
  },
  {
    day: THU,
    startTime: "09:00",
    endTime: "10:15",
    subject: "논리설계",
    professor: "이숙윤",
    room: "애기능생활관 301호",
  },
  {
    day: TUE,
    startTime: "12:00",
    endTime: "13:15",
    subject: "인공지능(영강)",
    professor: "정형진",
    room: "애기능생활관 301호",
  },
  {
    day: THU,
    startTime: "12:00",
    endTime: "13:15",
    subject: "인공지능(영강)",
    professor: "정형진",
    room: "애기능생활관 301호",
  },
  {
    day: MON,
    startTime: "13:30",
    endTime: "14:45",
    subject: "운영체제",
    professor: "양경식",
    room: "정보통신관 205호",
  },
  {
    day: WED,
    startTime: "13:30",
    endTime: "14:45",
    subject: "운영체제",
    professor: "양경식",
    room: "정보통신관 205호",
  },
  {
    day: TUE,
    startTime: "13:30",
    endTime: "14:45",
    subject: "확률최적화이론및실제(영강)",
    professor: "임성빈",
    room: "정경관 508호",
  },
  {
    day: FRI,
    startTime: "13:30",
    endTime: "14:45",
    subject: "확률최적화이론및실제(영강)",
    professor: "임성빈",
    room: "정경관 508호",
  },
  {
    day: MON,
    startTime: "16:30",
    endTime: "17:45",
    subject: "인과추론(영강)",
    professor: "김광호",
    room: "SK미래관 518",
  },
  {
    day: WED,
    startTime: "16:30",
    endTime: "17:45",
    subject: "인과추론(영강)",
    professor: "김광호",
    room: "SK미래관 518",
  },
  {
    day: WED,
    startTime: "18:30",
    endTime: "21:30",
    subject: "학원 조교",
    room: "학원",
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function withIds(list: Omit<ClassSession, "id">[]): ClassSession[] {
  return list.map((c, i) => ({ ...c, id: `seed-${i}` }));
}

/** 전체 시간표 조회 (없으면 시드 데이터로 초기화) */
export function getClassSchedule(): ClassSession[] {
  if (!isBrowser()) return withIds(SEED_CLASSES);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // 파싱 실패 시 시드로 복구
  }
  const seeded = withIds(SEED_CLASSES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

/**
 * 특정 요일(day: Date.getDay() 값)의 수업만 시간순으로 조회.
 * dateKey를 함께 주면, 그 날짜에 한해 휴강 처리된(classOverrides) 수업도
 * 목록에서 빼지 않고 그대로 두되 cancelled: true로 표시한다 — 화면에서
 * "휴강" 상태로 보여주기 위함이며, 실제로 제외하는 건 호출하는 쪽의 몫이 아니다.
 */
export function getClassesForDay(
  day: number,
  dateKey?: string
): ClassSession[] {
  return getClassSchedule()
    .filter((c) => c.day === day)
    .map((c) =>
      dateKey && isClassCancelled(dateKey, c.id) ? { ...c, cancelled: true } : c
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
