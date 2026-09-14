"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Notion의 <span color="yellow_bg">강조</span>를 <mark data-tone="yellow_bg">로
// 바꿔서, 우리 쪽 CSS로 다크/라이트 모두에서 대비가 맞는 하이라이트로 렌더링한다.
function preprocess(text: string): string {
  return text
    .replace(/<span color="([a-z_]+)">/g, (_m, tone: string) => {
      // Tailwind는 임의 선택자에서 "_"를 공백으로 해석하므로 하이픈으로 정규화
      return `<mark data-tone="${tone.replace(/_/g, "-")}">`;
    })
    .replace(/<\/span>/g, "</mark>");
}

type MdTextProps = {
  text: string;
  /** true면 <p>/<ul> 같은 블록 래퍼 없이 인라인으로만 렌더링 (제목용) */
  inline?: boolean;
  className?: string;
};

/** ML 노트의 본문 텍스트(볼드/리스트/하이라이트/인라인 코드)를 렌더링 */
export default function MdText({ text, inline = false, className }: MdTextProps) {
  const content = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        p: inline
          ? ({ children }) => <>{children}</>
          : ({ children }) => (
              <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-foreground/80">
                {children}
              </p>
            ),
        ul: ({ children }) => (
          <ul className="ml-5 list-disc space-y-1 text-[0.95rem] leading-relaxed text-foreground/80">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="ml-5 list-decimal space-y-1 text-[0.95rem] leading-relaxed text-foreground/80">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline decoration-blue-600/40 underline-offset-2 dark:text-blue-400"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.85em]">
            {children}
          </code>
        ),
        mark: ({ children, ...rest }) => (
          <mark
            {...rest}
            className="rounded bg-transparent px-0.5 font-medium text-foreground [&[data-tone=yellow-bg]]:bg-amber-300/40 dark:[&[data-tone=yellow-bg]]:bg-amber-400/25"
          >
            {children}
          </mark>
        ),
      }}
    >
      {preprocess(text)}
    </ReactMarkdown>
  );

  return inline ? (
    <span className={className}>{content}</span>
  ) : (
    <div className={cx("space-y-2", className)}>{content}</div>
  );
}
