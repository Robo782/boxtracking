import { useEffect, useState } from "react";
import { api } from "@/utils/api.js";

export default function UserManagement() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    username: "", password: "", role: "user",
  });
  const [err, setErr] = useState("");

  /* -------- Liste laden -------- */
  const load = () =>
    api("/api/admin/users")
      .then(r => r.json())
      .then(setList)
      .catch(() => setErr("Konnte Userliste nicht laden"));
  useEffect(load, []);

  /* -------- anlegen -------- */
  async function create(e) {
    e.preventDefault();
    const body = JSON.stringify({
      username: form.username,
      password: form.password || "changeme",
      role:     form.role,
    });
    await api("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    setForm({ username: "", password: "", role: "user" });
    load();
  }

  /* -------- Aktionen -------- */
  const resetPw = id =>
    confirm("PW auf 'changeme' setzen?") &&
      api(`/api/admin/users/${id}/reset`, { method: "PUT" }).then(load);

  const toggleRole = (id, cur) =>
    api(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: cur === "admin" ? "user" : "admin" }),
    }).then(load);

  const delUser = id =>
    confirm("User wirklich löschen?") &&
      api(`/api/admin/users/${id}`, { method: "DELETE" }).then(load);

  /* -------- UI -------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      <form onSubmit={create} className="card bg-base-100 p-4 max-w-md space-y-4">
        <h2 className="font-semibold">Neuer Benutzer</h2>

        <input
          name="username"
          id="username"
          className="input input-bordered w-full"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          required
        />

        <input
          name="password"
          id="password"
          className="input input-bordered w-full"
          placeholder="Passwort (optional)"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <select
          name="role"
          id="role"
          className="select select-bordered w-full"
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <button className="btn btn-primary w-full">Anlegen</button>
      </form>

      {err && <p className="text-error">{err}</p>}

      <table className="table">
        <thead>
          <tr><th>User</th><th>Rolle</th><th>Aktionen</th></tr>
        </thead>
        <tbody>
          {list.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td className="flex gap-2">
                <button onClick={() => toggleRole(u.id, u.role)} className="btn btn-xs">
                  Rolle ↺
                </button>
                <button onClick={() => resetPw(u.id)} className="btn btn-xs">
                  PW-Reset
                </button>
                <button onClick={() => delUser(u.id)} className="btn btn-error btn-xs">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
