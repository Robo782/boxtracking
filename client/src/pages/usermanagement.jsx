// client/src/pages/usermanagement.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { getAuth } from "@/utils/auth";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const nav = useNavigate();
  const { role } = getAuth();
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    if (role !== "admin") {
      nav("/boxes");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const load = async (signal) => {
    setErr("");
    try {
      const users = await api.get("/admin/users", { signal });
      setList(users);
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message || "Konnte Userliste nicht laden");
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api.post("/admin/users", {
        username: form.username.trim(),
        email: form.email.trim() || null,
        password: form.password,
        role: form.role,
      });
      setForm({ username: "", email: "", password: "", role: "user" });
      await load();
    } catch (e) {
      setErr(e.message || "Konnte User nicht anlegen");
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (id, newRole) => {
    setBusy(true);
    setErr("");
    try {
      await api.patch(`/admin/users/${id}`, { role: newRole });
      await load();
    } catch (e) {
      setErr(e.message || "Konnte Rolle nicht aktualisieren");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (id) => {
    const password = prompt("Neues Passwort für diesen Benutzer eingeben:");
    if (!password) return;
    setBusy(true);
    setErr("");
    try {
      await api.patch(`/admin/users/${id}/password`, { password });
      alert("Passwort erfolgreich gesetzt.");
    } catch (e) {
      setErr(e.message || "Konnte Passwort nicht setzen");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id, username) => {
    if (username === "admin") return; // UI-Schutz; Backend schützt zusätzlich
    if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return;
    setBusy(true);
    setErr("");
    try {
      await api.del(`/admin/users/${id}`);
      await load();
    } catch (e) {
      setErr(e.message || "Konnte Benutzer nicht löschen");
    } finally {
      setBusy(false);
    }
  };

  const sorted = useMemo(
    () => [...list].sort((a, b) => a.username.localeCompare(b.username)),
    [list]
  );

  const inputCls =
    "w-full rounded-md px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 " +
    "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  const btnNeutral =
    "px-2 py-1 border rounded-md border-slate-600 text-slate-200 hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed";

  const btnDanger =
    "px-2 py-1 border rounded-md border-red-400 text-red-200 hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4 text-slate-100">User Management</h1>

      {err && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 p-2 mb-4 rounded">
          {err}
        </div>
      )}

      {/* Neu anlegen */}
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-6">
        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-slate-300">Username*</label>
          <input
            className={inputCls}
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            minLength={2}
            placeholder="username"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-slate-300">E-Mail</label>
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="mail@example.com"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-slate-300">Passwort*</label>
          <input
            className={inputCls}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={4}
            placeholder="••••••"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-slate-300">Rolle*</label>
          <select
            className={inputCls}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-500 transition disabled:opacity-50"
          >
            Benutzer anlegen
          </button>
        </div>
      </form>

      {/* Tabelle */}
      <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/40">
        <table className="w-full">
          <thead className="bg-slate-800/60">
            <tr className="text-left text-slate-300">
              <th className="p-3 border-b border-slate-700">ID</th>
              <th className="p-3 border-b border-slate-700">Username</th>
              <th className="p-3 border-b border-slate-700">E-Mail</th>
              <th className="p-3 border-b border-slate-700">Rolle</th>
              <th className="p-3 border-b border-slate-700">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => {
              const isDefaultAdmin = u.username === "admin";
              return (
                <tr
                  key={u.id}
                  className="odd:bg-slate-900/30 even:bg-slate-900/10 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-3 border-b border-slate-800 text-slate-300">{u.id}</td>
                  <td className="p-3 border-b border-slate-800 text-slate-100">{u.username}</td>
                  <td className="p-3 border-b border-slate-800 text-slate-300">
                    {u.email || <span className="text-slate-500">—</span>}
                  </td>
                  <td className="p-3 border-b border-slate-800 text-slate-300">{u.role}</td>
                  <td className="p-3 border-b border-slate-800 space-x-2">
                    <button
                      className={btnNeutral}
                      onClick={() => updateRole(u.id, u.role === "admin" ? "user" : "admin")}
                      disabled={busy || isDefaultAdmin} // Standard-Admin in der UI nicht umschalten
                      title={isDefaultAdmin ? "Standard-Admin kann nicht umgestellt werden" : "Rolle umschalten"}
                    >
                      Rolle: {u.role === "admin" ? "→ user" : "→ admin"}
                    </button>
                    <button
                      className={btnNeutral}
                      onClick={() => resetPassword(u.id)}
                      disabled={busy}
                    >
                      Passwort setzen
                    </button>
                    <button
                      className={btnDanger}
                      onClick={() => remove(u.id, u.username)}
                      disabled={busy || isDefaultAdmin}
                      title={isDefaultAdmin ? "Standard-Admin kann nicht gelöscht werden" : "Benutzer löschen"}
                    >
                      löschen
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Keine Benutzer vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
