import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-lg shadow-blue-500/20 hover:bg-primary/subtle focus-visible:ring-2 focus-visible:ring-primary/60",
  secondary:
    "bg-white/10 text-slate-200 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/30",
  ghost: "bg-transparent text-slate-300 hover:bg-white/10",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger/70",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const merged = twMerge(
      "inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button ref={ref} className={merged} disabled={disabled || loading} {...props}>
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        <span className={clsx({ "opacity-70": loading })}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
