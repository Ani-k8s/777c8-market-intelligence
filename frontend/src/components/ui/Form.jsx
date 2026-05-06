import { cn } from "../../lib/utils.js";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-line bg-ink px-3 text-sm text-white placeholder:text-slate-500 transition focus:border-brand focus:outline-none",
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
        "h-10 w-full rounded-md border border-line bg-ink px-3 text-sm text-white transition focus:border-brand focus:outline-none",
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
        "w-full rounded-md border border-line bg-ink px-3 py-3 text-sm leading-6 text-white placeholder:text-slate-500 transition focus:border-brand focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
