import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-line bg-panelSoft text-slate-200",
  brand: "border-brand/50 bg-brand/10 text-brand",
  danger: "border-danger/50 bg-danger/10 text-danger",
  caution: "border-caution/50 bg-caution/10 text-caution",
  signal: "border-signal/50 bg-signal/10 text-signal",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold",
        variants[variant] || variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
