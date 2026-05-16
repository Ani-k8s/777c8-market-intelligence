import { useState } from "react";
import {
  Activity,
  BarChart3,
  BellDot,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageDown,
  Layers3,
  LogOut,
  Menu,
  Radar,
  Shield,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard",        icon: BarChart3, hash: "#overview"  },
  { label: "Market Analysis",  icon: Radar,     hash: "#analysis"  },
  { label: "Strike Planner",   icon: Layers3,   hash: "#strikes"   },
  { label: "Content Studio",   icon: ImageDown, hash: "#content"   },
  { label: "Reports",          icon: FileText,  hash: "#reports"   },
];

function LiveDot({ live }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
          live ? "bg-success" : "bg-caution"
        }`}
      />
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          live ? "bg-success" : "bg-caution"
        }`}
      />
    </span>
  );
}

function LogoMark({ size = "lg" }) {
  const dim = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={`${dim} relative grid place-items-center rounded-lg font-black shrink-0 overflow-hidden`}
      style={{
        background: "linear-gradient(135deg, #5A0010 0%, #C8102E 50%, #8B0000 100%)",
        boxShadow: "0 0 0 1px rgba(200,16,46,0.40), 0 4px 16px rgba(200,16,46,0.35)",
      }}
    >
      <span className="text-[#F0B429] drop-shadow-[0_0_6px_rgba(240,180,41,0.6)]">
        {size === "sm" ? "7c8" : "777"}
      </span>
    </div>
  );
}

export default function AppShell({ liveData, children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const status = liveData?.market_status?.status || "Loading";
  const live   = liveData?.is_live;

  const niftyPrice    = liveData?.indices?.NIFTY?.price;
  const bankNiftyPrice= liveData?.indices?.BANKNIFTY?.price;
  const niftyChg      = liveData?.indices?.NIFTY?.change_percent;
  const bankNiftyChg  = liveData?.indices?.BANKNIFTY?.change_percent;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-72";

  return (
    <div className="min-h-screen bg-ink text-textPrimary">

      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden ${sidebarWidth} transition-all duration-300 ease-in-out border-r border-line/50 lg:flex flex-col`}
        style={{
          background: "linear-gradient(180deg, #0A0A16 0%, #08080F 100%)",
          boxShadow: "1px 0 0 0 rgba(200,16,46,0.06), 4px 0 24px rgba(0,0,0,0.40)",
        }}
      >

        {/* --- Logo --- */}
        <div className={`flex items-center border-b border-line/50 p-4 ${collapsed ? "justify-center" : "gap-3"}`}
          style={{ background: "linear-gradient(90deg, rgba(200,16,46,0.05) 0%, transparent 100%)" }}
        >
          <LogoMark />
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="text-base font-black tracking-tight text-textPrimary">777c8</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-textMuted">
                Market Intelligence
              </p>
            </motion.div>
          )}
        </div>

        {/* --- Nav --- */}
        <nav className={`flex-1 space-y-0.5 p-3 ${collapsed ? "px-2" : ""}`}>
          {!collapsed && (
            <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-textMuted">
              Navigation
            </p>
          )}
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.hash}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-textMuted
                         transition-all duration-200
                         hover:bg-brandDim hover:text-textPrimary
                         ${collapsed ? "justify-center" : "gap-3"}`}
            >
              <item.icon
                size={17}
                className="shrink-0 text-textMuted group-hover:text-brand transition-colors duration-200"
              />
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}

          {user?.is_admin && (
            <>
              {!collapsed && (
                <p className="mt-4 mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-textMuted">
                  Administration
                </p>
              )}
              <NavLink
                to="/admin"
                title={collapsed ? "Admin Panel" : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                   ${collapsed ? "justify-center" : "gap-3"}
                   ${
                     isActive
                       ? "border-l-2 border-brand bg-brandDim pl-[10px] text-brand"
                       : "text-textMuted hover:bg-brandDim hover:text-textPrimary"
                   }`
                }
              >
                <Shield
                  size={17}
                  className="shrink-0 transition-colors duration-200 group-hover:text-brand"
                />
                {!collapsed && <span>Admin Panel</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* --- Market Pulse (when expanded) --- */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 mb-3 rounded-lg border border-line/50 p-3"
            style={{ background: "rgba(201,146,10,0.04)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-textMuted">
                Market Pulse
              </p>
              <LiveDot live={live} />
            </div>
            <p className="mt-2 text-xs font-semibold text-textSecondary">
              {status}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="text-textMuted">N:</span>
              <span className="font-bold text-textPrimary">
                {niftyPrice ? niftyPrice.toLocaleString("en-IN") : "—"}
              </span>
              {niftyChg != null && (
                <span className={niftyChg >= 0 ? "text-success" : "text-danger"}>
                  {niftyChg >= 0 ? "+" : ""}{niftyChg}%
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-textMuted">BN:</span>
              <span className="font-bold text-textPrimary">
                {bankNiftyPrice ? bankNiftyPrice.toLocaleString("en-IN") : "—"}
              </span>
              {bankNiftyChg != null && (
                <span className={bankNiftyChg >= 0 ? "text-success" : "text-danger"}>
                  {bankNiftyChg >= 0 ? "+" : ""}{bankNiftyChg}%
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* --- User Profile --- */}
        <div className="border-t border-line/50 p-3">
          {!collapsed ? (
            <div
              className="rounded-lg border border-line/50 p-3"
              style={{ background: "rgba(200,16,46,0.04)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #2A0010, #5A0020)",
                    boxShadow: "0 0 0 1px rgba(200,16,46,0.25)",
                  }}
                >
                  <UserRound size={16} className="text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-textPrimary">
                    {user?.username}
                  </p>
                  <p className="text-[10px] text-textMuted">
                    {user?.is_admin ? "Administrator" : "Trader"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full text-xs h-8"
                onClick={logout}
              >
                <LogOut size={14} />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={logout}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line/50 text-textMuted transition hover:border-danger/40 hover:bg-dangerDim hover:text-danger"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        {/* --- Collapse toggle --- */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-line/70 bg-surfaceHigh text-textMuted transition hover:border-brand/50 hover:text-brand"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ===================== MOBILE SIDEBAR OVERLAY ===================== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-line/50 lg:hidden"
              style={{
                background: "linear-gradient(180deg, #0A0A16 0%, #08080F 100%)",
                boxShadow: "4px 0 32px rgba(0,0,0,0.60)",
              }}
            >
              <div
                className="flex items-center justify-between border-b border-line/50 p-4"
                style={{ background: "linear-gradient(90deg, rgba(200,16,46,0.05) 0%, transparent 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <LogoMark />
                  <div>
                    <p className="text-base font-black text-textPrimary">777c8</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-textMuted">
                      Market Intelligence
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line/50 text-textMuted transition hover:border-brand/40 hover:text-brand"
                >
                  <X size={15} />
                </button>
              </div>

              <nav className="flex-1 space-y-0.5 p-3">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.hash}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-textMuted transition hover:bg-brandDim hover:text-textPrimary"
                  >
                    <item.icon size={17} className="shrink-0" />
                    {item.label}
                  </a>
                ))}
                {user?.is_admin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "border-l-2 border-brand bg-brandDim pl-[10px] text-brand"
                          : "text-textMuted hover:bg-brandDim hover:text-textPrimary"
                      }`
                    }
                  >
                    <Shield size={17} className="shrink-0" />
                    Admin Panel
                  </NavLink>
                )}
              </nav>

              <div className="border-t border-line/50 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, #2A0010, #5A0020)",
                      boxShadow: "0 0 0 1px rgba(200,16,46,0.25)",
                    }}
                  >
                    <UserRound size={16} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-textPrimary">{user?.username}</p>
                    <p className="text-[10px] text-textMuted">
                      {user?.is_admin ? "Administrator" : "Trader"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line/50 py-2 text-sm font-medium text-textSecondary transition hover:border-danger/40 hover:text-danger"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-[72px]" : "lg:pl-72"}`}>

        {/* --- Top Navbar --- */}
        <header
          className="sticky top-0 z-30 border-b border-line/50"
          style={{
            background: "rgba(7,7,15,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 1px 0 0 rgba(200,16,46,0.06), 0 4px 24px rgba(0,0,0,0.40)",
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">

            {/* Left — mobile logo + hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line/50 text-textMuted transition hover:border-brand/40 hover:text-brand lg:hidden"
              >
                <Menu size={17} />
              </button>

              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 lg:hidden">
                <LogoMark size="sm" />
                <div>
                  <p className="text-sm font-black text-textPrimary">777c8</p>
                  <p className="text-[9px] text-textMuted">Market Intelligence</p>
                </div>
              </div>

              {/* Desktop subtitle */}
              <div className="hidden items-center gap-2 lg:flex">
                <Sparkles size={14} className="text-goldLight" />
                <p className="text-xs font-semibold text-textMuted">
                  Behavior-driven institutional market terminal
                </p>
              </div>
            </div>

            {/* Right — status + market ticker (desktop) */}
            <div className="flex items-center gap-3">

              {/* Inline ticker — desktop only */}
              {(niftyPrice || bankNiftyPrice) && (
                <div className="hidden items-center gap-4 rounded-lg border border-line/40 bg-surfaceHigh px-4 py-1.5 text-xs lg:flex">
                  {niftyPrice && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-textMuted">NIFTY</span>
                      <span className="font-bold text-textPrimary">
                        {niftyPrice.toLocaleString("en-IN")}
                      </span>
                      {niftyChg != null && (
                        <span className={`font-semibold ${niftyChg >= 0 ? "text-success" : "text-danger"}`}>
                          {niftyChg >= 0 ? "▲" : "▼"} {Math.abs(niftyChg)}%
                        </span>
                      )}
                    </span>
                  )}
                  {niftyPrice && bankNiftyPrice && (
                    <span className="h-3 w-px bg-line/60" />
                  )}
                  {bankNiftyPrice && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-textMuted">BANKNIFTY</span>
                      <span className="font-bold text-textPrimary">
                        {bankNiftyPrice.toLocaleString("en-IN")}
                      </span>
                      {bankNiftyChg != null && (
                        <span className={`font-semibold ${bankNiftyChg >= 0 ? "text-success" : "text-danger"}`}>
                          {bankNiftyChg >= 0 ? "▲" : "▼"} {Math.abs(bankNiftyChg)}%
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}

              <Badge variant={live ? "success" : "caution"}>
                <LiveDot live={live} />
                <span>{status}</span>
              </Badge>
            </div>
          </div>
        </header>

        {/* --- Page Content --- */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
