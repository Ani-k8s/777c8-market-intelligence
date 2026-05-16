import { cn } from "../../lib/utils.js";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-textMuted",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-line/80 bg-ink px-3 text-sm text-textPrimary",
        "placeholder:text-textMuted",
        "transition-all duration-200",
        "focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15",
        "hover:border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-line/80 bg-ink px-3 text-sm text-textPrimary",
        "transition-all duration-200",
        "focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15",
        "hover:border-line",
        // Custom arrow via appearance-none isn't needed since we keep native
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-line/80 bg-ink px-3 py-3 text-sm leading-6 text-textPrimary",
        "placeholder:text-textMuted",
        "transition-all duration-200",
        "focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15",
        "hover:border-line",
        className,
      )}
      {...props}
    />
  );
}
