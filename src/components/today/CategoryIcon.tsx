// Today 탭 카드에 쓰는 카테고리별 아이콘. 외부 아이콘 라이브러리를 새로 추가하지
// 않고, 사이트 톤(가는 선, round cap)에 맞춘 최소한의 인라인 SVG로 직접 그린다.
// class(반복 수업)까지 포함해서 총 9종.

import type { ReactElement } from "react";
import type { TaskCategory } from "@/lib/taskCategory";

export type CategoryIconKind = TaskCategory | "class";

type IconProps = {
  className?: string;
};

const SHARED = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 학교 수업 / school 카테고리 — 책
function BookIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5c-.83 0-1.5-.67-1.5-1.5v-13Z" />
      <path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H12v16h6.5c.83 0 1.5-.67 1.5-1.5v-13Z" />
    </svg>
  );
}

// DEAR Time — 펼친 책
function OpenBookIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="M12 6.5c-1.6-1.3-3.6-2-6-2-.55 0-1 .45-1 1v11c0 .55.45 1 1 1 2.4 0 4.4.7 6 2" />
      <path d="M12 6.5c1.6-1.3 3.6-2 6-2 .55 0 1 .45 1 1v11c0 .55-.45 1-1 1-2.4 0-4.4.7-6 2" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

// Study — 노트(스프링 + 줄)
function NotebookIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.8" />
      <path d="M8.5 3.5v17M13 8h5M13 12h5M13 16h4" />
    </svg>
  );
}

// exam — 연필
function PencilIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z" />
      <path d="M12.5 6.5l5 5" />
    </svg>
  );
}

// assignment — 체크리스트가 있는 클립보드
function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="1.8" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m8.5 12 1.8 1.8L13.5 10" />
      <path d="M9 17h6" />
    </svg>
  );
}

// club — 여러 사람
function UsersIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <circle cx="9" cy="8.5" r="2.6" />
      <path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" />
      <path d="M15.5 6.3a2.6 2.6 0 1 1 0 5.2" />
      <path d="M16 14.6c2.2.5 3.7 2.1 4.2 4.4" />
    </svg>
  );
}

// tutoring — 학사모
function CapIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" />
      <path d="M6.5 10.7v4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4" />
      <path d="M21 9v5" />
    </svg>
  );
}

// personal — 별
function StarIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="m12 3.5 2.55 5.4 5.95.75-4.4 4.15 1.15 5.9L12 16.9l-5.25 2.8 1.15-5.9-4.4-4.15 5.95-.75L12 3.5Z" />
    </svg>
  );
}

// project — 폴더
function FolderIcon({ className }: IconProps) {
  return (
    <svg {...SHARED} className={className}>
      <path d="M3.5 6.2c0-.94.76-1.7 1.7-1.7h4l1.8 2h7.3c.94 0 1.7.76 1.7 1.7v9.1c0 .94-.76 1.7-1.7 1.7H5.2c-.94 0-1.7-.76-1.7-1.7V6.2Z" />
    </svg>
  );
}

const ICONS: Record<CategoryIconKind, (props: IconProps) => ReactElement> = {
  class: BookIcon,
  school: BookIcon,
  dearTime: OpenBookIcon,
  study: NotebookIcon,
  exam: PencilIcon,
  assignment: ClipboardIcon,
  club: UsersIcon,
  tutoring: CapIcon,
  personal: StarIcon,
  project: FolderIcon,
};

export default function CategoryIcon({
  kind,
  className,
}: {
  kind: CategoryIconKind;
  className?: string;
}) {
  const Icon = ICONS[kind];
  return <Icon className={className} />;
}
