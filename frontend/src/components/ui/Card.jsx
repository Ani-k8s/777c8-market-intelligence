import { cn } from "../../lib/utils.js";

export function Card({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-line bg-panel/[0.92] shadow-[0_24px_80px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("border-b border-line px-5 py-4", className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
