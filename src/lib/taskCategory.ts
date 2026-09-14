// home 탭 할일의 카테고리 정의 + 카테고리별 색상 스타일.
// AddTaskForm(선택 칩)과 Timeline(색상 태그/블록)에서 공통으로 사용한다.
//
// 색상 원칙: 사이트 전체 포인트 컬러는 blue 하나로 통일한다.
// 카테고리는 서로 다른 색상을 쓰지 않고, 하나의 무채색(slate) 톤 안에서
// 명도만 다르게 줘서 차분하게 구분한다. (선택 상태 강조는 공통으로 blue)
// 학교 시간표(반복 수업)만 유일하게 포인트 컬러(blue)를 사용해
// 일반 할일과 한눈에 구분되게 한다.

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
  /** 점(point) 마커, 범례, 폼 칩의 색상 스와치 — 같은 톤(slate), 명도만 다름 */
  dot: string;
  /** 타임라인의 기간(block) 항목 스타일 — 모든 카테고리 공통의 차분한 톤 */
  block: string;
};

// 모든 task 블록이 공유하는 중립(무채색) 글래스 톤
const TASK_BLOCK_BASE =
  "border-foreground/10 bg-white/55 text-foreground dark:border-white/10 dark:bg-white/[0.06]";

export const CATEGORY_STYLES: Record<TaskCategory, CategoryStyle> = {
  personal: {
    label: "Personal",
    dot: "bg-slate-300",
    block: TASK_BLOCK_BASE,
  },
  school: {
    label: "School",
    dot: "bg-slate-400",
    block: TASK_BLOCK_BASE,
  },
  club: {
    // 다크 배경에선 500 아래로 내려가면 거의 안 보여서 400으로 보정
    label: "Club",
    dot: "bg-slate-500 dark:bg-slate-400",
    block: TASK_BLOCK_BASE,
  },
  tutoring: {
    label: "Tutoring",
    dot: "bg-slate-600 dark:bg-slate-400",
    block: TASK_BLOCK_BASE,
  },
  exam: {
    label: "Exam",
    dot: "bg-slate-700 dark:bg-slate-300",
    block: TASK_BLOCK_BASE,
  },
  assignment: {
    label: "Assignment",
    dot: "bg-slate-800 dark:bg-slate-300",
    block: TASK_BLOCK_BASE,
  },
  // DEAR Time / Study는 나머지 6개(무채색 slate)와 겹치지 않는 전용 색상 태그를
  // 쓴다 — 값은 dataviz 카테고리 팔레트(violet/red 슬롯)에서 가져옴.
  // block은 다른 카테고리와 동일하게 중립 유리 톤을 유지해 타임라인 전체의
  // 차분한 톤은 그대로 두고, 점(dot) 색으로만 구분한다.
  dearTime: {
    label: "DEAR Time",
    dot: "bg-[#4a3aa7] dark:bg-[#9085e9]",
    block: TASK_BLOCK_BASE,
  },
  study: {
    label: "Study",
    dot: "bg-[#e34948] dark:bg-[#e66767]",
    block: TASK_BLOCK_BASE,
  },
  // In Progress 위젯(진행중 프로젝트) 전용 — 나머지 8개와 겹치지 않는
  // 따뜻한 브라운/캐러멜 톤
  project: {
    label: "Project",
    dot: "bg-[#a1662f] dark:bg-[#c9975a]",
    block: TASK_BLOCK_BASE,
  },
};

// Today 탭 전용: 카테고리별로 실제 색이 뚜렷하게 구분되는 카드를 그리기 위한
// 진한 accent 팔레트. 홈 타임라인의 차분한 slate 톤과는 별개로, Today
// 탭에서만 "색이 화면의 주인공"이 되도록 쓴다. globals.css의 --cat-* 변수를
// 참조해서 라이트/다크 모드에 따라 자동으로 값이 바뀐다.
// class(반복 수업)는 사이트 전역에서 이미 blue를 쓰므로 겹치지 않게 별도 slot,
// personal은 원래도 가장 중립적인 카테고리라 무채색(slate) accent를 그대로 쓴다.
export type CategoryAccent = { solid: string; soft: string };

export const CATEGORY_ACCENT: Record<TaskCategory, CategoryAccent> = {
  personal: { solid: "var(--cat-personal)", soft: "var(--cat-personal-soft)" },
  school: { solid: "var(--cat-school)", soft: "var(--cat-school-soft)" },
  club: { solid: "var(--cat-club)", soft: "var(--cat-club-soft)" },
  tutoring: { solid: "var(--cat-tutoring)", soft: "var(--cat-tutoring-soft)" },
  exam: { solid: "var(--cat-exam)", soft: "var(--cat-exam-soft)" },
  assignment: {
    solid: "var(--cat-assignment)",
    soft: "var(--cat-assignment-soft)",
  },
  dearTime: { solid: "var(--cat-deartime)", soft: "var(--cat-deartime-soft)" },
  study: { solid: "var(--cat-study)", soft: "var(--cat-study-soft)" },
  project: { solid: "var(--cat-project)", soft: "var(--cat-project-soft)" },
};

export const CLASS_ACCENT: CategoryAccent = {
  solid: "var(--cat-class)",
  soft: "var(--cat-class-soft)",
};

// 폼에서 선택된 카테고리 칩의 공통 강조 스타일 (사이트 포인트 컬러: blue)
// 다크모드에선 블루를 더 밝게 + 배경 대비도 살짝 키움
export const ACCENT_CHIP_SELECTED =
  "border-blue-400/60 bg-blue-500/15 text-blue-700 dark:border-blue-400/50 dark:bg-blue-400/20 dark:text-blue-200";

// 학교 시간표(반복 수업) 전용 색 — 유일하게 포인트 컬러(blue)를 사용해
// "학교" 카테고리로 수동 입력한 할일과도 구분된다.
export const CLASS_BLOCK_STYLE =
  "border-blue-300/60 bg-blue-100/70 text-blue-900 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200";
export const CLASS_DOT_STYLE = "bg-blue-500";
