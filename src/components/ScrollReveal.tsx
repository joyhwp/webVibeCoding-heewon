"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 등장 애니메이션 지연(초) — 여러 항목을 순차적으로 살짝 엇갈리게 할 때 사용 */
  delay?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "style" | "children">;

/**
 * 화면에 스크롤되어 들어올 때 아래에서 위로 살짝 슬라이드되며 페이드인되는
 * 래퍼. 한 번 나타난 뒤에는 계속 보이는 상태를 유지한다(과하지 않게).
 * onClick/title/role 등 나머지 div 속성은 그대로 통과시켜, 이 래퍼 자체를
 * 클릭 가능한 항목(예: 휴강된 수업 블록)으로도 쓸 수 있게 한다.
 */
export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: `${style?.transform ?? ""} ${
          visible ? "translateY(0)" : "translateY(14px)"
        }`.trim(),
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
