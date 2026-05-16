import { cn } from "../../lib/utils.js";

export function Card({ className, children }) {
  return (
    <section
      className={cn(
        // Glassmorphism base
        "relative rounded-xl border border-line/70 bg-surface/90",
        // Premium shadow stack
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_24px_80px_rgba(0,0,0,0.55)]",
        // Subtle inner glow on top edge
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand/20 before:to-transparent",
        "overflow-hidden",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        "relative border-b border-line/60 px-6 py-4",
        // Subtle red-tinted gradient header bg
        "bg-gradient-to-r from-brand/[0.04] to-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}
