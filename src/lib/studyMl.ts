import rawContent from "@/data/studyMlContent.json";

// Notion "ML" 페이지를 파싱해서 만든 정적 스냅샷 데이터 구조.
// (study 탭은 지금 실시간 Notion API 연동이 아니라, 한 번 가져와 정리한
//  콘텐츠를 로컬에 고정해서 보여주는 방식 — CLAUDE.md의 "실 연동 전 구조
//  확인 필요" 단계에 해당하는 1회성 정리본)

export type TextBlock = { type: "text"; md: string };
export type CodeBlock = { type: "code"; lang: string; code: string };
export type MathBlock = { type: "math"; tex: string };
export type ImageBlock = {
  type: "image";
  file: string;
  w: number;
  h: number;
  caption?: string;
  ambiguous?: boolean;
  ambiguousNote?: string;
};
export type CalloutBlock = { type: "callout"; blocks: ContentBlock[] };

export type ContentBlock =
  | TextBlock
  | CodeBlock
  | MathBlock
  | ImageBlock
  | CalloutBlock;

export type Section = {
  title: string;
  slug: string;
  blocks: ContentBlock[];
};

export type Week = {
  title: string;
  slug: string;
  intro: ContentBlock[];
  sections: Section[];
};

export type Category = {
  title: string;
  slug: string;
  intro: ContentBlock[];
  weeks: Week[];
};

export const mlContent = rawContent as unknown as Category[];

/** 검색/TOC용으로 각 섹션(H3, 없으면 그 주차 자체)을 평평하게 펼친 목록 */
export type FlatSection = {
  categorySlug: string;
  categoryTitle: string;
  weekSlug: string;
  weekTitle: string;
  slug: string;
  title: string;
  blocks: ContentBlock[];
  isEmpty: boolean;
};

function blocksSearchText(blocks: ContentBlock[]): string {
  let out = "";
  for (const b of blocks) {
    if (b.type === "text") out += " " + b.md;
    else if (b.type === "code") out += " " + b.code;
    else if (b.type === "math") out += " " + b.tex;
    else if (b.type === "image") out += " " + (b.caption ?? "");
    else if (b.type === "callout") out += " " + blocksSearchText(b.blocks);
  }
  return out;
}

export function flattenSections(content: Category[]): FlatSection[] {
  const out: FlatSection[] = [];
  for (const cat of content) {
    for (const week of cat.weeks) {
      if (week.sections.length === 0) {
        out.push({
          categorySlug: cat.slug,
          categoryTitle: cat.title,
          weekSlug: week.slug,
          weekTitle: week.title,
          slug: week.slug,
          title: week.title,
          blocks: week.intro,
          isEmpty: week.intro.length === 0,
        });
        continue;
      }
      for (const section of week.sections) {
        out.push({
          categorySlug: cat.slug,
          categoryTitle: cat.title,
          weekSlug: week.slug,
          weekTitle: week.title,
          slug: section.slug,
          title: section.title,
          blocks: section.blocks,
          isEmpty: section.blocks.length === 0,
        });
      }
    }
  }
  return out;
}

export function searchSections(
  sections: FlatSection[],
  query: string
): FlatSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;
  return sections.filter((s) => {
    const haystack = (
      s.title +
      " " +
      s.categoryTitle +
      " " +
      s.weekTitle +
      " " +
      blocksSearchText(s.blocks)
    ).toLowerCase();
    return haystack.includes(q);
  });
}

export function imagePath(file: string): string {
  return `/study/ml/images/${file}`;
}
