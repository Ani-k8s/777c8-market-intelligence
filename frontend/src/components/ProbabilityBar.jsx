const colors = {
  sideways: "bg-caution",
  breakout: "bg-brand",
  sharp_move: "bg-signal",
};

const labels = {
  sideways: "Sideways",
  breakout: "Breakout",
  sharp_move: "Sharp Move",
};

export default function ProbabilityBar({ name, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{labels[name] || name}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-ink">
        <div className={`h-full ${colors[name] || "bg-brand"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
