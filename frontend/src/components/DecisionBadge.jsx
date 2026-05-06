export default function DecisionBadge({ decision }) {
  const palette = {
    AVOID: "border-danger/60 bg-danger/15 text-danger",
    WAIT: "border-caution/60 bg-caution/15 text-caution",
    "TRADE SETUP": "border-brand/60 bg-brand/15 text-brand",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-bold ${
        palette[decision] || "border-line bg-panelSoft text-slate-200"
      }`}
    >
      {decision || "WAIT"}
    </span>
  );
}
