import { useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Clipboard,
  Download,
  FileDown,
  ImageDown,
  RefreshCcw,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";

import { getApiError } from "../api/client.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import { Input, Label, Select, Textarea } from "../components/ui/Form.jsx";
import useMarketData from "../hooks/useMarketData.js";
import AppShell from "../layouts/AppShell.jsx";
import {
  analyzeMarket,
  fetchStrikeSuggestions,
  generateCopy,
  generateImagePayload,
} from "../services/marketService.js";

const initialForm = {
  index: "NIFTY",
  budget: "5000",
  risk: "Medium",
};

const probabilityColors = {
  sideways: "#C9920A",
  breakout: "#C8102E",
  sharp_move: "#60A5FA",
};

export default function Dashboard() {
  const { data: liveData, loading: liveLoading, error: liveError, refresh } = useMarketData();
  const [form, setForm] = useState(initialForm);
  const [analysis, setAnalysis] = useState(null);
  const [strikes, setStrikes] = useState(null);
  const [copyText, setCopyText] = useState("");
  const [imagePayload, setImagePayload] = useState(null);
  const [imageFormat, setImageFormat] = useState("square");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const imageRef = useRef(null);

  const selectedSnapshot = liveData?.indices?.[form.index];
  const chartData = liveData?.candles?.[form.index] || analysis?.candles || [];
  const payload = useMemo(
    () => ({
      index: form.index,
      budget: Number(form.budget),
      risk: form.risk,
    }),
    [form],
  );

  async function runEngine(event) {
    event?.preventDefault();
    setError("");
    setLoading(true);
    setCopied(false);
    try {
      const [analysisResult, strikeResult, copyResult, imageResult] = await Promise.all([
        analyzeMarket(payload),
        fetchStrikeSuggestions(payload),
        generateCopy(payload),
        generateImagePayload({ ...payload, image_format: imageFormat }),
      ]);
      setAnalysis(analysisResult);
      setStrikes(strikeResult);
      setCopyText(copyResult.message);
      setImagePayload(imageResult);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyMessage() {
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function downloadImage() {
    if (!imageRef.current || !analysis) return;
    const html2canvas = (await import("html2canvas")).default;
    const scale = imageFormat === "story" ? 3 : 2;
    const canvas = await html2canvas(imageRef.current, {
      backgroundColor: "#070B10",
      scale,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `777c8-${analysis.index}-${imageFormat}-${analysis.date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function downloadReport() {
    if (!analysis || !strikes) return;
    const report = {
      generated_at: new Date().toISOString(),
      analysis,
      strikes,
      copy: copyText,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `777c8-report-${analysis.index}-${analysis.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell liveData={liveData}>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant={liveData?.is_live ? "success" : "caution"}>
              {liveData?.source || "Connecting"}
            </Badge>
            <Badge variant="signal">{liveData?.sentiment?.label || "Loading sentiment"}</Badge>
            <Badge variant={liveData?.market_status?.high_decay ? "danger" : "default"}>
              {liveData?.expiry_warning || "Expiry monitor"}
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-textPrimary md:text-5xl">
            Market{" "}
            <span style={{ backgroundImage: "linear-gradient(135deg,#C8102E,#F0B429)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Intelligence</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-textSecondary">
            Live index intelligence · Operator-retail psychology · Probability mapping ·
            Budget-aware strike planning · Branded content generation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => refresh(true)} disabled={liveLoading}>
            <RefreshCcw size={16} className={liveLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button type="button" variant="secondary" onClick={downloadReport} disabled={!analysis}>
            <FileDown size={16} />
            Report
          </Button>
        </div>
      </div>

      {liveError ? (
        <div className="mb-6 rounded-xl border border-danger/30 bg-dangerDim px-4 py-3 text-sm text-danger">
          {liveError}
        </div>
      ) : null}

      <section id="overview" className="grid gap-4 xl:grid-cols-4">
        <MarketCard title="NIFTY Live Price" snapshot={liveData?.indices?.NIFTY} />
        <MarketCard title="BANKNIFTY Live Price" snapshot={liveData?.indices?.BANKNIFTY} />
        <MetricCard
          title="Volatility"
          value={liveData?.volatility ? `${liveData.volatility.value}%` : "--"}
          subtitle={liveData?.volatility?.label || "Waiting"}
          icon={Activity}
          tone="signal"
        />
        <MetricCard
          title="Time Status"
          value={liveData?.market_status?.status || "--"}
          subtitle={liveData?.market_status?.time || "IST"}
          icon={Zap}
          tone={liveData?.market_status?.high_decay ? "danger" : "brand"}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_390px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">Intraday Structure</h2>
              <p className="mt-1 text-sm text-slate-500">{form.index} candle movement and range behavior</p>
            </div>
            <Badge variant={selectedSnapshot?.change >= 0 ? "brand" : "danger"}>
              {selectedSnapshot?.change_percent ?? "--"}%
            </Badge>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8102E" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1C1C2E" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#4A4A6A" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 11 }} />
                <YAxis stroke="#4A4A6A" tickLine={false} axisLine={false} domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0D0D1A", border: "1px solid #1C1C2E", borderRadius: 10, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#C8102E"
                  fill="url(#priceFill)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-black">Engine Inputs</h2>
            <p className="mt-1 text-sm text-slate-500">Live price is used automatically.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={runEngine}>
              <div className="grid grid-cols-2 gap-2">
                {["NIFTY", "BANKNIFTY"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                      form.index === item
                        ? "border-brand/60 bg-brandDim text-brand shadow-[0_0_0_1px_rgba(200,16,46,0.20)]"
                        : "border-line/70 bg-ink text-textMuted hover:border-line hover:text-textPrimary"
                    }`}
                    onClick={() => setForm({ ...form, index: item })}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div>
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="500"
                  step="100"
                  value={form.budget}
                  onChange={(event) => setForm({ ...form, budget: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="risk">Risk Appetite</Label>
                <Select
                  id="risk"
                  value={form.risk}
                  onChange={(event) => setForm({ ...form, risk: event.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </Select>
              </div>
              <div className="rounded-xl border border-lineGold/40 bg-goldDim p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-textMuted">Live Price</p>
                <p className="mt-1.5 text-3xl font-black text-goldLight">
                  {selectedSnapshot?.price ? selectedSnapshot.price.toLocaleString("en-IN") : "—"}
                </p>
              </div>
              {error ? (
                <div className="rounded-lg border border-danger/30 bg-dangerDim p-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className="w-full h-11" disabled={loading || liveLoading}>
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Running Engine…" : "Run Analysis Engine"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section id="analysis" className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <AnalysisEngine analysis={analysis} />
        <ProbabilityEngine analysis={analysis} />
      </section>

      <OperatorRetail analysis={analysis} />

      <section id="strikes" className="mt-6">
        <StrikeSuggestions strikes={strikes} />
      </section>

      <section id="content" className="mt-6 grid gap-6 2xl:grid-cols-[1fr_620px]">
        <ContentGenerator
          copyText={copyText}
          copied={copied}
          onCopy={copyMessage}
          onDownload={downloadReport}
        />
        <ImageGenerator
          analysis={analysis}
          imagePayload={imagePayload}
          imageRef={imageRef}
          imageFormat={imageFormat}
          setImageFormat={setImageFormat}
          onDownload={downloadImage}
        />
      </section>

      <section id="reports" className="mt-6">
        <RiskPanel warnings={analysis?.risk_warnings} />
      </section>
    </AppShell>
  );
}

function MarketCard({ title, snapshot }) {
  const up = (snapshot?.change || 0) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-black text-white">
              {snapshot?.price ? snapshot.price.toLocaleString("en-IN") : "--"}
            </p>
          </div>
          <div className={`rounded-md border p-2 ${up ? "border-brand/40 bg-brand/10 text-brand" : "border-danger/40 bg-danger/10 text-danger"}`}>
            <Icon size={19} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className={up ? "text-brand" : "text-danger"}>
            {snapshot?.change ?? "--"} ({snapshot?.change_percent ?? "--"}%)
          </span>
          <span className="text-slate-500">{snapshot?.source || "Waiting"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, tone }) {
  const toneMap = {
    brand: "border-brand/40 bg-brand/10 text-brand",
    signal: "border-signal/40 bg-signal/10 text-signal",
    danger: "border-danger/40 bg-danger/10 text-danger",
  };
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className={`rounded-md border p-2 ${toneMap[tone] || toneMap.brand}`}>
            <Icon size={19} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisEngine({ analysis }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">Market Analysis Engine</h2>
          <p className="mt-1 text-sm text-slate-500">Trend, range, momentum, traps, and fake breakout conditions</p>
        </div>
        <DecisionBadge decision={analysis?.decision} />
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div className="grid gap-4 md:grid-cols-4">
            <EngineMetric label="Market State" value={analysis.market_state} />
            <EngineMetric label="Strength" value={`${analysis.strength_score}/100`} />
            <EngineMetric label="Pattern" value={analysis.pattern} />
            <EngineMetric label="Risk Meter" value={`${analysis.risk_meter.label} · ${analysis.risk_meter.score}`} />
          </div>
        ) : (
          <SkeletonGrid count={4} />
        )}

        {analysis ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-lg border border-line bg-ink p-4">
              <p className="text-sm font-bold text-white">Final Interpretation</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.interpretation}</p>
            </div>
            <div className="rounded-lg border border-line bg-ink p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Support / Resistance</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <span className="text-slate-400">Support</span>
                <span className="text-right font-bold text-brand">{analysis.support_resistance.support}</span>
                <span className="text-slate-400">Resistance</span>
                <span className="text-right font-bold text-danger">{analysis.support_resistance.resistance}</span>
                <span className="text-slate-400">ATM</span>
                <span className="text-right font-bold text-white">{analysis.support_resistance.atm_strike}</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProbabilityEngine({ analysis }) {
  const data = analysis
    ? Object.entries(analysis.probability).map(([name, value]) => ({ name, value }))
    : [
        { name: "sideways", value: 34 },
        { name: "breakout", value: 33 },
        { name: "sharp_move", value: 33 },
      ];
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-black">Historical Probability Engine</h2>
        <p className="mt-1 text-sm text-slate-500">Similar expiry, range, and time-window behavior</p>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={60} outerRadius={88} paddingAngle={5}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={probabilityColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0D0D1A", border: "1px solid #1C1C2E", borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-slate-400">{item.name.replace("_", " ")}</span>
                <span className="font-bold text-white">{item.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-sm bg-ink">
                <div
                  className="h-full"
                  style={{ width: `${item.value}%`, background: probabilityColors[item.name] }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OperatorRetail({ analysis }) {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-3">
      <MindsetCard title="Retail Mindset" icon={ShieldAlert} text={analysis?.retail} tone="danger" />
      <MindsetCard title="Operator Mindset" icon={Target} text={analysis?.operator} tone="brand" />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-black">Final Interpretation</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-300">
            {analysis?.interpretation ||
              "Run the engine to connect live price, range compression, time decay, and option-chain context."}
          </p>
          <div className="mt-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis ? Object.entries(analysis.probability).map(([name, value]) => ({ name, value })) : []}>
                <CartesianGrid stroke="#1C1C2E" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#4A4A6A" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#4A4A6A" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0D0D1A", border: "1px solid #1C1C2E", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#C8102E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MindsetCard({ title, icon: Icon, text, tone }) {
  const toneClass = tone === "brand" ? "border-gold/40 bg-goldDim text-goldLight" : "border-danger/40 bg-dangerDim text-danger";
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`rounded-md border p-2 ${toneClass}`}>
            <Icon size={18} />
          </div>
          <h2 className="text-lg font-black">{title}</h2>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-300">
          {text || "Run the engine to reveal behavior-driven market psychology."}
        </p>
      </CardContent>
    </Card>
  );
}

function StrikeSuggestions({ strikes }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">Strike Price Recommender</h2>
          <p className="mt-1 text-sm text-slate-500">Conservative, balanced, and aggressive execution paths</p>
        </div>
        {strikes ? <Badge variant="brand">{strikes.preferred_direction} bias · ATM {strikes.nearest_atm}</Badge> : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 xl:grid-cols-3">
          {(strikes?.suggestions || []).map((item) => (
            <article key={`${item.profile}-${item.strike}`} className="rounded-lg border border-line bg-ink p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{item.profile}</p>
                  <h3 className="mt-2 text-3xl font-black text-white">
                    {item.strike} {item.option_type}
                  </h3>
                </div>
                <Badge variant={item.risk_label === "High" ? "danger" : item.risk_label === "Medium" ? "caution" : "brand"}>
                  {item.risk_label}
                </Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <p>{item.entry_condition}</p>
                <p className="font-semibold text-brand">{item.entry_zone}</p>
                <p>{item.stop_loss}</p>
                <p>{item.target}</p>
                <p className="text-slate-500">{item.capital_note}</p>
              </div>
            </article>
          ))}
          {!strikes ? <SkeletonGrid count={3} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentGenerator({ copyText, copied, onCopy, onDownload }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Content Generator</h2>
          <p className="mt-1 text-sm text-slate-500">Social, Telegram, WhatsApp, and report-ready output</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCopy} disabled={!copyText}>
            <Clipboard size={15} />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onDownload} disabled={!copyText}>
            <Download size={15} />
            Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea className="min-h-[420px] resize-y" value={copyText} readOnly placeholder="Run analysis to generate formatted content." />
      </CardContent>
    </Card>
  );
}

function ImageGenerator({ analysis, imagePayload, imageRef, imageFormat, setImageFormat, onDownload }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">Image Generator</h2>
          <p className="mt-1 text-sm text-slate-500">Instagram square and story exports</p>
        </div>
        <div className="flex gap-2">
          {["square", "story"].map((format) => (
            <button
              key={format}
              type="button"
              className={`rounded-md border px-3 py-2 text-xs font-bold capitalize ${
                imageFormat === format ? "border-brand bg-brand/10 text-brand" : "border-line bg-ink text-slate-400"
              }`}
              onClick={() => setImageFormat(format)}
            >
              {format}
            </button>
          ))}
          <Button type="button" size="sm" onClick={onDownload} disabled={!analysis}>
            <ImageDown size={15} />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <BrandedImageCard analysis={analysis} imagePayload={imagePayload} imageRef={imageRef} format={imageFormat} />
        </div>
      </CardContent>
    </Card>
  );
}

function BrandedImageCard({ analysis, imageRef, format }) {
  const isStory = format === "story";
  const width = isStory ? 360 : 540;
  const height = isStory ? 640 : 540;
  const probability = analysis?.probability || { sideways: 0, breakout: 0, sharp_move: 0 };
  return (
    <div
      ref={imageRef}
      style={{ width, height }}
      className="relative overflow-hidden rounded-lg border border-line bg-[#07070F] p-8 text-white"
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, rgba(200,16,46,0.20), transparent 35%), radial-gradient(circle at 82% 75%, rgba(201,146,10,0.14), transparent 30%)" }} />
      <div className="absolute inset-0 grid place-items-center text-[108px] font-black" style={{ color: "rgba(255,255,255,0.03)" }}>
        777c8
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl font-black" style={{ backgroundImage: "linear-gradient(135deg,#C8102E,#F0B429)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>777c8</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#4A4A6A" }}>Market Intelligence</p>
          </div>
          <Badge variant={analysis?.is_live ? "brand" : "caution"}>{analysis?.source || "Live"}</Badge>
        </div>
        <div className="mt-10 border-y border-line py-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {analysis ? `${analysis.index} · ${analysis.time}` : "Index · Time"}
          </p>
          <h3 className="mt-4 text-4xl font-black">{analysis?.market_state || "Market State"}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{analysis?.pattern || "Pattern detection"}</p>
          <div className="mt-5">
            <DecisionBadge decision={analysis?.decision} />
          </div>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {Object.entries(probability).map(([name, value]) => (
            <div key={name} className="rounded-md border border-line bg-panel/85 p-3 text-center">
              <p className="text-2xl font-black" style={{ color: probabilityColors[name] }}>
                {value}%
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {name.replace("_", " ")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-md border border-caution/35 bg-caution/10 p-3 text-xs leading-5 text-caution">
          Rule-based analysis only. No guaranteed predictions.
        </div>
      </div>
    </div>
  );
}

function RiskPanel({ warnings }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3 text-sm leading-6 text-caution">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            {(warnings || [
              "Rule-based educational view only; this is not financial advice.",
              "No guaranteed predictions. Use position sizing, stop loss, and independent judgment.",
            ]).map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EngineMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-line/60 bg-ink p-4" style={{ background: "rgba(7,7,15,0.85)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-textMuted">{label}</p>
      <p className="mt-3 text-lg font-black text-textPrimary">{value}</p>
    </div>
  );
}

function DecisionBadge({ decision }) {
  const variant = decision === "TRADE SETUP" ? "gold" : decision === "AVOID" ? "danger" : "caution";
  return <Badge variant={variant}>{decision || "WAIT"}</Badge>;
}

function SkeletonGrid({ count }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="rounded-xl border border-line/50 bg-ink p-4 animate-pulse">
      <div className="h-2.5 w-20 rounded-md bg-surfaceHigh" />
      <div className="mt-5 h-7 w-28 rounded-md bg-surfaceHigh" />
      <div className="mt-4 h-2.5 w-full rounded-md bg-surfaceHigh" />
    </div>
  ));
}
