import { cn } from "@/lib/utils";

// Shield + check mark: "this has been checked" rather than "this is guaranteed".
// Single currentColor-free fill (emerald) so it reads the same in light and dark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <path
        d="M24 3 L42 10.5 V23 C42 35 33.8 42.7 24 45.5 C14.2 42.7 6 35 6 23 V10.5 Z"
        className="fill-emerald-600"
      />
      <path
        d="M15.5 24 L21.5 30 L32.5 17.5"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  withWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      {withWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">TrueSeat</span>
      ) : null}
    </span>
  );
}
