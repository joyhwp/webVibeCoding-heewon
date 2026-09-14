import type { ButtonHTMLAttributes } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function GlassButton({
  className,
  variant = "primary",
  ...rest
}: GlassButtonProps) {
  return (
    <button
      className={cx(
        "rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" &&
          "bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)] hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
        variant === "secondary" &&
          "glass-panel text-foreground hover:brightness-105",
        className
      )}
      {...rest}
    />
  );
}
