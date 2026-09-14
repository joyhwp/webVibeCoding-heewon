import hljs from "highlight.js";

type CodeBlockProps = {
  lang: string;
  code: string;
};

/** 코드 블록 — highlight.js로 문법 강조, 다크/라이트 색상은 globals.css의
 * .hljs-* 토큰이 --foreground/--glass-* 변수를 참조해서 테마에 맞게 바뀐다. */
export default function CodeBlock({ lang, code }: CodeBlockProps) {
  const language = hljs.getLanguage(lang) ? lang : undefined;
  const result = language
    ? hljs.highlight(code, { language })
    : hljs.highlightAuto(code);

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04] dark:bg-black/30">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-1.5">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-foreground/40">
          {result.language ?? language ?? "code"}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-[0.85rem] leading-relaxed">
        <code
          className="hljs font-mono"
          dangerouslySetInnerHTML={{ __html: result.value }}
        />
      </pre>
    </div>
  );
}
