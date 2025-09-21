import clsx from "clsx";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-lg",
  }[size];

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-white/10 text-primary-foreground font-semibold uppercase",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
