import { useEffect, useState } from "react";
import { CalendarClock, KeyRound, Plus, RefreshCcw, Trash2, UserRound } from "lucide-react";

import { getApiError } from "../api/client.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import { Input, Label } from "../components/ui/Form.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../layouts/AppShell.jsx";
import {
  createUser,
  deleteUser,
  getAdminStats,
  listUsers,
  resetPassword,
  setUserExpiry,
  toggleUser,
} from "../services/authService.js";

const emptyForm = { username: "", email: "", password: "", access_expires_at: "" };

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resetValues, setResetValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdmin() {
    setLoading(true);
    setError("");
    try {
      const [userRows, statRows] = await Promise.all([listUsers(), getAdminStats()]);
      setUsers(userRows);
      setStats(statRows);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        access_expires_at: form.access_expires_at ? new Date(form.access_expires_at).toISOString() : null,
      };
      await createUser(payload);
      setForm(emptyForm);
      setMessage("User created.");
      await loadAdmin();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(target) {
    setError("");
    setMessage("");
    try {
      const updated = await toggleUser(target.id, !target.is_active);
      setUsers((current) => current.map((item) => (item.id === target.id ? updated : item)));
      await refreshStats();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleExpiry(target, value) {
    setError("");
    try {
      const updated = await setUserExpiry(target.id, value ? new Date(value).toISOString() : null);
      setUsers((current) => current.map((item) => (item.id === target.id ? updated : item)));
      await refreshStats();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleReset(target) {
    const password = resetValues[target.id];
    if (!password) return;
    setError("");
    setMessage("");
    try {
      await resetPassword(target.id, password);
      setResetValues((current) => ({ ...current, [target.id]: "" }));
      setMessage(`${target.username} password reset.`);
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleDelete(target) {
    if (!window.confirm(`Delete ${target.username}?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteUser(target.id);
      setUsers((current) => current.filter((item) => item.id !== target.id));
      setMessage(`${target.username} deleted.`);
      await refreshStats();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function refreshStats() {
    const statRows = await getAdminStats();
    setStats(statRows);
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-textPrimary">
            Admin{" "}
            <span style={{ backgroundImage: "linear-gradient(135deg,#C8102E,#F0B429)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Panel</span>
          </h1>
          <p className="mt-2 text-sm text-textSecondary">
            Manage private access, account expiry, password resets, and user status.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={loadAdmin} disabled={loading}>
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats?.total_users ?? "--"} />
        <StatCard label="Active Users" value={stats?.active_users ?? "--"} tone="brand" />
        <StatCard label="Disabled" value={stats?.disabled_users ?? "--"} tone="danger" />
        <StatCard label="Expired" value={stats?.expired_users ?? "--"} tone="caution" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-black">Create User</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleCreate}>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="datetime-local"
                  value={form.access_expires_at}
                  onChange={(event) => setForm({ ...form, access_expires_at: event.target.value })}
                />
              </div>
              {error ? (
                <div className="rounded-lg border border-danger/30 bg-dangerDim p-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-lg border border-gold/30 bg-goldDim p-3 text-sm text-goldLight">
                  {message}
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={saving}>
                <Plus size={16} />
                {saving ? "Creating" : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-lg font-black">Users</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-textMuted" style={{ background: "rgba(13,13,26,0.80)" }}>
                <tr>
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Access</th>
                  <th className="px-5 py-3.5 font-semibold">Expiry</th>
                  <th className="px-5 py-3.5 font-semibold">Reset Password</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {users.map((target) => (
                  <tr key={target.id} className="transition-colors duration-150 hover:bg-brandDim/40">
                    <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg,#2A0010,#5A0020)", boxShadow: "0 0 0 1px rgba(200,16,46,0.25)" }}>
                            <UserRound size={15} className="text-brand" />
                          </div>
                          <div>
                            <p className="font-bold text-textPrimary">{target.username}</p>
                            <p className="text-xs text-textMuted">{target.email || "No email"}</p>
                          </div>
                        </div>
                    </td>
                      <td className="px-5 py-4">
                        <Badge variant={target.is_admin ? "gold" : "default"}>
                          {target.is_admin ? "Admin" : "Trader"}
                        </Badge>
                      </td>
                    <td className="px-5 py-4">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={target.is_active}
                          disabled={target.id === user?.id}
                          onChange={() => handleToggle(target)}
                        />
                        <span className="h-6 w-11 rounded-full bg-line/80 transition after:ml-1 after:mt-1 after:block after:h-4 after:w-4 after:rounded-full after:bg-textMuted after:transition after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-5 peer-checked:after:bg-white peer-disabled:cursor-not-allowed peer-disabled:opacity-60" />
                        <span className="text-textSecondary text-xs">
                          {target.is_expired ? "Expired" : target.is_active ? "Active" : "Disabled"}
                        </span>
                      </label>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock size={15} className="text-slate-500" />
                        <Input
                          type="datetime-local"
                          className="w-56"
                          defaultValue={toLocalInput(target.access_expires_at)}
                          onBlur={(event) => handleExpiry(target, event.target.value)}
                          disabled={target.id === user?.id}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          className="w-44"
                          minLength={8}
                          value={resetValues[target.id] || ""}
                          onChange={(event) =>
                            setResetValues((current) => ({ ...current, [target.id]: event.target.value }))
                          }
                          placeholder="New password"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => handleReset(target)}
                          disabled={target.id === user?.id || !resetValues[target.id]}
                        >
                          <KeyRound size={15} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={target.id === user?.id}
                        onClick={() => handleDelete(target)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function StatCard({ label, value, tone = "default" }) {
  const variant = tone === "brand" ? "success" : tone === "danger" ? "danger" : tone === "caution" ? "caution" : "default";
  const accentColor = tone === "brand" ? "#22C55E" : tone === "danger" ? "#EF4444" : tone === "caution" ? "#F59E0B" : "#4A4A6A";
  return (
    <Card>
      <CardContent>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-textMuted">{label}</p>
        <p className="mt-3 text-4xl font-black" style={{ color: accentColor }}>{value}</p>
        <div className="mt-4">
          <Badge variant={variant}>Access Control</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
