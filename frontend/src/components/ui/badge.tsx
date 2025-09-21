import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "success" | "danger";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        {
          "bg-white/10 text-white": variant === "default",
          "border border-white/20 text-white": variant === "outline",
          "bg-success/15 text-success": variant === "success",
          "bg-danger/15 text-danger": variant === "danger",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
