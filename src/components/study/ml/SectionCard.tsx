import type { Section } from "@/lib/studyMl";
import MdText from "@/components/study/MdText";
import BlockRenderer from "@/components/study/BlockRenderer";

type SectionCardProps = { section: Section };

/** H3(소제목)을 카드 형태로 — 아코디언(week) 내부의 한 덩어리 */
export default function SectionCard({ section }: SectionCardProps) {
  const isEmpty = section.blocks.length === 0;

  return (
    <div
      id={section.slug}
      className="scroll-mt-28 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 dark:bg-white/[0.02]"
    >
      <h4 className="mb-3 text-[0.95rem] font-semibold tracking-tight text-foreground">
        <MdText text={section.title} inline />
      </h4>
      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-6 text-center text-sm text-foreground/40">
          정리 예정
        </p>
      ) : (
        <BlockRenderer blocks={section.blocks} />
      )}
    </div>
  );
}
