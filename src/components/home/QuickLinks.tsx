"use client";

import { useEffect, useRef, useState } from "react";

type QuickLink = {
  label: string;
  href: string;
  filled?: boolean;
};

const LINKS: QuickLink[] = [
  { label: "School LMS", href: "https://lms.korea.ac.kr/", filled: true },
  {
    label: "Google Drive",
    href: "https://drive.google.com/drive/u/0/folders/17gfMeuEnuWR_szH7cxADnodzUdJMwcy2?ths=true",
  },
  {
    label: "Gmail",
    href: "https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox",
  },
  { label: "Spotify", href: "https://open.spotify.com/", filled: true },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 이 지점부터 시작해 이 지점에서 완전히 전환되도록(뷰포트 높이 대비 비율)
const FADE_START_RATIO = 0.85;
const FADE_END_RATIO = 0.4;
// 배경이 이만큼 어두워진 뒤에야 콘텐츠가 나타나기 시작(애플 페이지처럼 배경이 먼저 자리잡음)
const CONTENT_START = 0.35;

export default function QuickLinks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0); // 0 = 밝은 배경, 1 = 완전한 블랙

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * FADE_START_RATIO;
      const end = vh * FADE_END_RATIO;
      const raw = (start - rect.top) / (start - end);
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const contentProgress = Math.min(
    1,
    Math.max(0, (progress - CONTENT_START) / (1 - CONTENT_START))
  );

  return (
    <section
      ref={sectionRef}
      className="relative left-1/2 right-1/2 -mx-[50vw] mt-20 flex min-h-[70vh] w-screen items-center justify-center px-4"
      style={{ backgroundColor: `rgba(6, 6, 8, ${progress})` }}
    >
      <div
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 py-24 text-center"
        style={{
          opacity: contentProgress,
          transform: `translateY(${(1 - contentProgress) * 18}px)`,
        }}
      >
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Quick Links
        </h2>
        <p className="text-sm text-white/60">
          Jump straight to what you use most
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cx(
                "rounded-full px-6 py-3 text-sm font-medium transition-colors",
                link.filled
                  ? "bg-white text-black hover:bg-white/90"
                  : "border border-white/30 text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
