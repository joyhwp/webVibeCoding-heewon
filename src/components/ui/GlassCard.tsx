import type { HTMLAttributes } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type GlassCardProps = HTMLAttributes<HTMLDivElement>;

export default function GlassCard({
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cx(
        "glass-panel rounded-3xl p-6 sm:p-8",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
