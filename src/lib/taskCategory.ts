// home 탭 할일의 카테고리 정의 + 카테고리별 색상 스타일.
// AddTaskForm(선택 칩)과 Timeline(색상 태그/블록)에서 공통으로 사용한다.
//
// 색상 원칙 (Dashboard v4 세이지 팔레트): 사이트 전체에 카테고리별로 다른
// 색(남색/빨강/갈색/보라 등)을 주지 않는다. 카테고리는 전부 같은 중립 톤으로
// 표시하고, "선택됨/활성" 상태일 때만 공통 포인트 컬러(getCategoryColor())를
// 쓴다. 새 기능을 추가할 때도 색을 직접 하드코딩하지 말고 반드시
// getCategoryColor()를 통해 가져올 것 — 그래야 나중에 팔레트를 바꿀 때 이
// 파일 하나만 고치면 전체 화면에 자동으로 반영된다.

export type TaskCategory =
  | "personal"
  | "school"
  | "club"
  | "tutoring"
  | "exam"
  | "assignment"
  | "dearTime"
  | "study"
  | "project";

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "school", label: "School" },
  { value: "club", label: "Club" },
  { value: "tutoring", label: "Tutoring" },
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "dearTime", label: "DEAR Time" },
  { value: "study", label: "Study" },
  { value: "project", label: "Project" },
];

type CategoryStyle = {
  label: string;
  /** 점(point) 마커, 범례, 폼 칩의 색상 스와치 — 모든 카테고리가 같은 중립 톤을 공유 */
  dot: string;
  /** 타임라인의 기간(block) 항목 스타일 — 모든 카테고리 공통의 차분한 톤 */
  block: string;
};

// 모든 task 블록이 공유하는 중립(무채색) 글래스 톤
const TASK_BLOCK_BASE =
  "border-foreground/10 bg-white/55 text-foreground dark:border-white/10 dark:bg-white/[0.06]";

// 카테고리 구분 없이 공유하는 중립 점(dot) 색 — 예전엔 카테고리마다 다른 색을
// 썼지만, Dashboard v4 리디자인 이후로는 색으로 카테고리를 구분하지 않는다.
const NEUTRAL_DOT = "bg-slate-400";

export const CATEGORY_STYLES: Record<TaskCategory, CategoryStyle> = Object.fromEntries(
  TASK_CATEGORIES.map(({ value, label }) => [
    value,
    { label, dot: NEUTRAL_DOT, block: TASK_BLOCK_BASE },
  ])
) as Record<TaskCategory, CategoryStyle>;

export type CategoryAccent = { solid: string; soft: string };

/**
 * 사이트 전체가 공유하는 단일 포인트 컬러 쌍 — solid는 강조(선택/진행률/포인트),
 * soft는 그 위에 얹는 연한 배경 틴트. 카테고리·상태와 무관하게 항상 이 한
 * 쌍만 반환한다: 예전에는 카테고리마다 다른 색(CATEGORY_ACCENT)을 하드코딩
 * 했지만, Dashboard v4 세이지 팔레트로 통일하면서 이 헬퍼 하나로 합쳤다.
 *
 * - solid: var(--accent) — 라이트/다크/Clean 어디서든 같은 포인트 컬러
 *   (팔레트 스위처가 세이지/네이비를 바꾸면 여기도 자동으로 바뀐다).
 * - soft: var(--accent)를 15% 불투명도로 섞은 반투명 톤. 고정 hex가 아니라
 *   투명도 기반이라 카드/배경이 라이트든 다크든 항상 자연스럽게 녹아든다
 *   (다크모드에 라이트용 베이지가 그대로 얹혀서 붕 뜨는 문제를 피함).
 *
 * 새로 추가하는 기능도 색을 직접 하드코딩하지 말고 반드시 이 함수(또는 이
 * 함수로 만들어진 CATEGORY_ACCENT/CLASS_ACCENT)를 통해 색을 가져올 것.
 */
export function getCategoryColor(): CategoryAccent {
  return {
    solid: "var(--accent)",
    soft: "color-mix(in srgb, var(--accent) 15%, transparent)",
  };
}

export const CATEGORY_ACCENT: Record<TaskCategory, CategoryAccent> = Object.fromEntries(
  TASK_CATEGORIES.map(({ value }) => [value, getCategoryColor()])
) as Record<TaskCategory, CategoryAccent>;

export const CLASS_ACCENT: CategoryAccent = getCategoryColor();

// 폼에서 선택된 카테고리 칩의 공통 강조 스타일 (사이트 포인트 컬러: 세이지 그린)
// 다크모드에선 기존 블루를 더 밝게 + 배경 대비도 살짝 키움
export const ACCENT_CHIP_SELECTED =
  "border-[#8B9A6E]/60 bg-[#8B9A6E]/15 text-[#4C553D] dark:border-blue-400/50 dark:bg-blue-400/20 dark:text-blue-200";

// 선택되지 않은 카테고리 칩의 기본(중립) 스타일 — #EEEEEE 계열 배경 + 진한
// 텍스트. --hero-chip이 라이트/다크/Clean 값을 이미 갖고 있어 그대로 재사용.
export const NEUTRAL_CHIP_UNSELECTED =
  "border-transparent bg-[var(--hero-chip)] text-foreground/70 hover:brightness-95";

// 학교 시간표(반복 수업) 전용 색 — 유일하게 포인트 컬러를 사용해
// "학교" 카테고리로 수동 입력한 할일과도 구분된다.
export const CLASS_BLOCK_STYLE =
  "border-[#8B9A6E]/40 bg-[#8B9A6E]/15 text-[#313627] dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200";
export const CLASS_DOT_STYLE = "bg-[#8B9A6E] dark:bg-blue-500";
