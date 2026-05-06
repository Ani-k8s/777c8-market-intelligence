import { BarChart3, Shield, LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Shell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-brand/40 bg-brand/10 text-sm font-black text-brand">
              777
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white">777c8</p>
              <p className="truncate text-xs font-medium text-slate-400">Market Intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `ghost-button hidden px-3 sm:inline-flex ${isActive ? "border-brand text-white" : ""}`
              }
            >
              <BarChart3 size={16} />
              Dashboard
            </NavLink>
            {user?.is_admin ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `ghost-button px-3 ${isActive ? "border-brand text-white" : ""}`
                }
              >
                <Shield size={16} />
                Admin
              </NavLink>
            ) : null}
            <button type="button" onClick={logout} className="ghost-button px-3">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
