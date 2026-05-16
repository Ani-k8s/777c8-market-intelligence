import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Lock,
  LogIn,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { getApiError } from "../api/client.js";
import Button from "../components/ui/Button.jsx";
import { Input, Label } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
  "Operator vs Retail Psychology Analysis",
  "Live NIFTY & BANKNIFTY Intelligence",
  "Budget-Aware Strike Price Planning",
  "Expiry Trap & Decay Detection",
  "AI-style Market Interpretation",
  "Historical Probability Engine",
  "Branded Content Generator",
];

const stats = [
  { label: "Operator",   value: "Live",  sub: "Psychology"  },
  { label: "Probability",value: "Engine",sub: "AI-powered"  },
  { label: "Decay",      value: "Alert", sub: "Expiry Watch" },
];

function LogoMark() {
  return (
    <div
      className="grid h-14 w-14 place-items-center rounded-xl font-black shrink-0"
      style={{
        background: "linear-gradient(135deg, #5A0010 0%, #C8102E 50%, #8B0000 100%)",
        boxShadow:
          "0 0 0 1px rgba(200,16,46,0.50), 0 8px 32px rgba(200,16,46,0.45)",
      }}
    >
      <span
        className="text-base text-[#F0B429]"
        style={{ filter: "drop-shadow(0 0 8px rgba(240,180,41,0.70))" }}
      >
        777
      </span>
    </div>
  );
}

export default function Login() {
  const navigate  = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm]     = useState({ username: "Admin", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      navigate(user.is_admin ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen text-textPrimary lg:grid-cols-[1.15fr_0.85fr]" style={{ background: "#07070F" }}>

      {/* ============ LEFT PANEL — Brand/Hero ============ */}
      <section className="relative hidden overflow-hidden lg:block">

        {/* Background layers */}
        <div className="absolute inset-0" style={{ background: "#07070F" }} />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Red radial glow — top left */}
        <div
          className="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full blur-[120px]"
          style={{ background: "rgba(200,16,46,0.18)" }}
        />
        {/* Gold radial glow — bottom right */}
        <div
          className="absolute -bottom-32 -right-24 h-[400px] w-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(201,146,10,0.12)" }}
        />

        {/* Animated ring 1 */}
        <motion.div
          className="absolute left-12 top-20 h-80 w-80 rounded-full border"
          style={{ borderColor: "rgba(200,16,46,0.18)" }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.25, 0.50, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Animated ring 2 */}
        <motion.div
          className="absolute bottom-24 right-16 h-64 w-64 rounded-full border"
          style={{ borderColor: "rgba(201,146,10,0.18)" }}
          animate={{ scale: [1.06, 1, 1.06], opacity: [0.30, 0.15, 0.30] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Watermark */}
        <div
          className="pointer-events-none absolute bottom-10 right-6 select-none text-[120px] font-black leading-none"
          style={{ color: "rgba(255,255,255,0.025)" }}
        >
          777c8
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">

          {/* Top logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <LogoMark />
            <div>
              <p className="text-xl font-black text-textPrimary tracking-tight">777c8</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-textMuted">
                Private Terminal · v2
              </p>
            </div>
          </motion.div>

          {/* Hero copy */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.10 }}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-bold"
              style={{
                borderColor: "rgba(200,16,46,0.35)",
                background: "rgba(200,16,46,0.08)",
                color: "#E8192C",
              }}
            >
              <RadioTower size={13} />
              Institutional Market Intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-5xl font-black leading-[1.06] tracking-tight text-textPrimary"
            >
              Decode index behavior{" "}
              <span
                className="bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(135deg, #C8102E, #F0B429)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                before retail reacts.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="mt-5 max-w-md text-base leading-8 text-textSecondary"
            >
              Premium NIFTY & BANKNIFTY analysis — expiry traps, range compression,
              probability bias, and budget-aware option execution.
            </motion.p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + index * 0.08 }}
                className="rounded-xl border p-4 backdrop-blur-sm"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "#4A4A6A" }}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-black text-textPrimary">{item.value}</p>
                <p className="mt-0.5 text-[10px] text-textMuted">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RIGHT PANEL — Login Form ============ */}
      <section
        className="grid place-items-center px-4 py-10 sm:px-8"
        style={{
          background:
            "linear-gradient(160deg, rgba(200,16,46,0.04) 0%, #07070F 40%)",
          borderLeft: "1px solid rgba(200,16,46,0.08)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div
            className="rounded-2xl border p-8"
            style={{
              borderColor: "rgba(200,16,46,0.15)",
              background: "rgba(13,13,26,0.90)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow:
                "0 0 0 1px rgba(200,16,46,0.08), 0 40px 120px rgba(0,0,0,0.60), 0 0 80px rgba(200,16,46,0.06)",
            }}
          >
            {/* Top gradient line */}
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(200,16,46,0.50) 40%, rgba(201,146,10,0.35) 60%, transparent)",
              }}
            />

            {/* Logo + title */}
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <LogoMark />
                <div>
                  <p className="text-lg font-black text-textPrimary">777c8</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-textMuted">
                    Market Intelligence
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-black text-textPrimary">Welcome back</h2>
              <p className="mt-1.5 text-sm leading-6 text-textSecondary">
                Access your private institutional terminal
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  autoComplete="username"
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textMuted"
                  />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-danger/30 bg-dangerDim px-3.5 py-2.5 text-sm text-danger"
                >
                  {error}
                </motion.div>
              ) : null}

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={17} />
                    Access Terminal
                  </span>
                )}
              </Button>
            </form>

            {/* Features */}
            <div className="mt-7 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-textPrimary">
                <ShieldCheck size={15} className="text-brand" />
                Platform capabilities
              </div>
              <div className="grid gap-2">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.40 + i * 0.05 }}
                    className="flex items-center gap-2.5 text-xs text-textSecondary"
                  >
                    <CheckCircle2 size={13} className="shrink-0 text-goldLight" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* JWT badge */}
            <div
              className="mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-textMuted"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Sparkles size={12} className="text-goldLight" />
              JWT secured · No public signup · Institutional access only
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
