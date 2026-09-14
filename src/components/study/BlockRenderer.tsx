import type { ContentBlock } from "@/lib/studyMl";
import MdText from "@/components/study/MdText";
import CodeBlockView from "@/components/study/CodeBlock";
import MathBlock from "@/components/study/MathBlock";
import ImageBlock from "@/components/study/ImageBlock";

type BlockRendererProps = { blocks: ContentBlock[] };

/** 섹션(또는 콜아웃) 안의 블록들을 순서대로, 종류에 맞는 UI로 렌더링 */
export default function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return <MdText key={i} text={block.md} />;
          case "code":
            return <CodeBlockView key={i} lang={block.lang} code={block.code} />;
          case "math":
            return <MathBlock key={i} tex={block.tex} />;
          case "image":
            return <ImageBlock key={i} block={block} />;
          case "callout":
            return (
              <aside
                key={i}
                className="rounded-2xl border border-amber-400/40 bg-amber-300/10 p-4 dark:border-amber-300/25 dark:bg-amber-300/[0.06]"
              >
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  참고
                </p>
                <BlockRenderer blocks={block.blocks} />
              </aside>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
