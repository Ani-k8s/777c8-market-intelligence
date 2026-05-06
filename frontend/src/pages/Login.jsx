import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, LogIn, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { getApiError } from "../api/client.js";
import Button from "../components/ui/Button.jsx";
import { Input, Label } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
  "Operator vs Retail Analysis",
  "Live NIFTY/BANKNIFTY Intelligence",
  "Budget-based Strike Suggestions",
  "Expiry Trap Detection",
  "AI-style Market Interpretation",
  "Probability-Based Decision Engine",
  "Social Media Content Generator",
];

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ username: "Admin", password: "" });
  const [error, setError] = useState("");
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
    <main className="grid min-h-screen bg-ink text-white lg:grid-cols-[1.12fr_0.88fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-[#060A0F] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,211,159,0.22),transparent_28%),radial-gradient(circle_at_76%_38%,rgba(91,192,235,0.18),transparent_28%),linear-gradient(135deg,rgba(244,185,66,0.08),transparent_42%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        <motion.div
          className="absolute left-16 top-24 h-72 w-72 rounded-full border border-brand/25"
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.48, 0.25] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-28 right-20 h-64 w-64 rounded-full border border-signal/25"
          animate={{ scale: [1.08, 1, 1.08], opacity: [0.35, 0.18, 0.35] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md border border-brand/50 bg-brand/10 text-sm font-black text-brand">
              777
            </div>
            <div>
              <p className="text-xl font-black">777c8</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Private terminal
              </p>
            </div>
          </div>

          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-bold text-brand"
            >
              <RadioTower size={16} />
              Live market intelligence
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-6xl font-black leading-[1.02] tracking-normal"
            >
              Decode index behavior before retail reacts.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
            >
              Premium NIFTY and BANKNIFTY analysis for expiry traps, range compression,
              probability bias, and budget-aware option execution.
            </motion.p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Operator", "Probability", "Premium Decay"].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className="rounded-lg border border-line bg-white/[0.04] p-4 backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item}</p>
                <p className="mt-2 text-2xl font-black text-white">Live</p>
              </motion.div>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-16 right-8 text-[132px] font-black leading-none text-white/[0.035]">
            777c8
          </div>
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl"
        >
          <div className="mb-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md border border-brand/40 bg-brand/10 text-sm font-black text-brand">
              777
            </div>
            <h2 className="text-2xl font-black">777c8 Market Intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Trade smarter with behavior-driven market analysis
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                autoComplete="username"
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn size={17} />
              {loading ? "Authenticating" : "Login"}
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-200">
              <ShieldCheck size={17} className="text-brand" />
              Private SaaS capabilities
            </div>
            <div className="grid gap-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-2 text-xs text-slate-500">
            <Sparkles size={14} className="text-caution" />
            JWT protected. No public signup.
          </div>
        </motion.div>
      </section>
    </main>
  );
}
