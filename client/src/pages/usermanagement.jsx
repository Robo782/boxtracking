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

  const remove = async (id) => {
    if (!confirm("Diesen Benutzer wirklich löschen?")) return;
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">User Management</h1>

      {err && <div className="bg-red-100 border border-red-300 text-red-700 p-2 mb-3 rounded">{err}</div>}

      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end mb-6">
        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Username*</label>
          <input
            className="w-full border rounded px-2 py-1"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            minLength={2}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1">E-Mail</label>
          <input
            className="w-full border rounded px-2 py-1"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Passwort*</label>
          <input
            className="w-full border rounded px-2 py-1"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={4}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm mb-1">Rolle*</label>
          <select
            className="w-full border rounded px-2 py-1"
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
            className="w-full bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            Benutzer anlegen
          </button>
        </div>
      </form>

      <table className="w-full border rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Username</th>
            <th className="p-2 border-b">E-Mail</th>
            <th className="p-2 border-b">Rolle</th>
            <th className="p-2 border-b">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => (
            <tr key={u.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border-b">{u.id}</td>
              <td className="p-2 border-b">{u.username}</td>
              <td className="p-2 border-b">{u.email || "—"}</td>
              <td className="p-2 border-b">{u.role}</td>
              <td className="p-2 border-b space-x-2">
                <button
                  className="px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => updateRole(u.id, u.role === "admin" ? "user" : "admin")}
                  disabled={busy}
                >
                  Rolle: {u.role === "admin" ? "→ user" : "→ admin"}
                </button>
                <button
                  className="px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => resetPassword(u.id)}
                  disabled={busy}
                >
                  Passwort setzen
                </button>
                <button
                  className="px-2 py-1 border rounded hover:bg-red-50 text-red-700 border-red-300"
                  onClick={() => remove(u.id)}
                  disabled={busy}
                >
                  löschen
                </button>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                Keine Benutzer vorhanden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
