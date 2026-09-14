import katex from "katex";
import "katex/dist/katex.min.css";

type MathBlockProps = { tex: string };

/** LaTeX 수식을 KaTeX로 렌더링 (display mode) */
export default function MathBlock({ tex }: MathBlockProps) {
  const html = katex.renderToString(tex, {
    displayMode: true,
    throwOnError: false,
    strict: false,
  });

  return (
    <div
      className="overflow-x-auto rounded-2xl bg-foreground/[0.04] px-4 py-3 text-foreground dark:bg-black/20"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
