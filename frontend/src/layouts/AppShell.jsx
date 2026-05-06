import {
  BarChart3,
  BellDot,
  FileText,
  ImageDown,
  Layers3,
  LogOut,
  Radar,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", icon: BarChart3, hash: "#overview" },
  { label: "Market Analysis", icon: Radar, hash: "#analysis" },
  { label: "Strike Suggestions", icon: Layers3, hash: "#strikes" },
  { label: "Content Generator", icon: ImageDown, hash: "#content" },
  { label: "Reports", icon: FileText, hash: "#reports" },
];

export default function AppShell({ liveData, children }) {
  const { user, logout } = useAuth();
  const status = liveData?.market_status?.status || "Loading";
  const live = liveData?.is_live;

  return (
    <div className="min-h-screen bg-ink text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-line bg-[#080C11]/95 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-line p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md border border-brand/50 bg-brand/10 text-sm font-black text-brand">
                777
              </div>
              <div>
                <p className="text-lg font-black">777c8</p>
                <p className="text-xs font-medium text-slate-500">Market Intelligence</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.hash}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <item.icon size={17} />
                {item.label}
              </a>
            ))}
            {user?.is_admin ? (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <Shield size={17} />
                Admin Panel
              </NavLink>
            ) : null}
          </nav>

          <div className="border-t border-line p-4">
            <div className="rounded-lg border border-line bg-panel p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-ink text-brand">
                  <UserRound size={17} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user?.username}</p>
                  <p className="text-xs text-slate-500">{user?.is_admin ? "Administrator" : "Trader"}</p>
                </div>
              </div>
              <Button type="button" variant="secondary" className="mt-3 w-full" onClick={logout}>
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-ink/[0.88] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-brand/50 bg-brand/10 text-sm font-black text-brand">
                777
              </div>
              <div>
                <p className="text-base font-black">777c8</p>
                <p className="text-xs text-slate-500">Market Intelligence</p>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Sparkles size={18} className="text-caution" />
              <p className="text-sm font-semibold text-slate-300">
                Behavior-driven market intelligence terminal
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={live ? "brand" : "caution"}>
                <BellDot size={13} className="mr-1" />
                {status}
              </Badge>
              <Button type="button" variant="ghost" size="icon" onClick={logout} className="lg:hidden">
                <LogOut size={17} />
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
