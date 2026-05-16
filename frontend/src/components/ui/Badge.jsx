import { cn } from "../../lib/utils.js";

const variants = {
  default:  "border-line/70 bg-surfaceHigh text-textSecondary",
  brand:    "border-brand/40 bg-brandDim text-brand",
  gold:     "border-gold/40 bg-goldDim text-goldLight",
  danger:   "border-danger/40 bg-dangerDim text-danger",
  caution:  "border-caution/40 bg-cautionDim text-caution",
  signal:   "border-signal/40 bg-signalDim text-signal",
  success:  "border-success/40 bg-successDim text-success",
  // Legacy aliases
  caution:  "border-caution/40 bg-cautionDim text-caution",
};

export default function Badge({ variant = "default", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        variants[variant] ?? variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
