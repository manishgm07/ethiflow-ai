import { cn } from "@/lib/utils";

/** EthiFlow mark: a stylised 4-way junction with a signal head. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9z" className="fill-navy" opacity="0.9" />
      <circle cx="16" cy="16" r="3.2" className="fill-amber" />
    </svg>
  );
}

export function BrandWordmark({ className, tone = "default" }: { className?: string; tone?: "default" | "inverse" }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span
        className={cn(
          "font-display text-lg font-bold leading-none tracking-tight",
          tone === "inverse" ? "text-navy-foreground" : "text-foreground",
        )}
      >
        EthiFlow<span className="text-amber"> AI</span>
      </span>
    </span>
  );
}
