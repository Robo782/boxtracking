// client/src/pages/UserManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function UserManagement() {
  const nav  = useNavigate();
  const role = localStorage.getItem("role");

  const cfg = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  /* Guards */
  useEffect(() => {
    if (role !== "admin") nav("/boxes");
  }, [role, nav]);

  /* State */
  const [users, setUsers] = useState([]);
  const [form,  setForm]  = useState({ username: "", password: "", role: "user" });
  const [err,   setErr]   = useState("");

  /* Laden */
  const loadUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/users", cfg);
      setUsers(data);
    } catch {
      setErr("⚠️ Benutzer konnten nicht geladen werden");
    }
  };
  useEffect(() => { loadUsers(); }, []);

  /* Anlegen */
  const addUser = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await axios.post("/api/admin/users", form, cfg);
      setForm({ username: "", password: "", role: "user" });
      loadUsers();
    } catch (e) {
      setErr(e.response?.data?.error || "Fehler beim Speichern");
    }
  };

  return (
    <section className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">👥 Benutzerverwaltung</h1>
        <Link to="/admin" className="btn btn-sm">↩ Dashboard</Link>
      </header>

      {/* Tabelle */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Bestehende Benutzer</h2>
          {users.length === 0 ? (
            <div className="alert alert-info mt-3">Keine Benutzer vorhanden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Rolle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className="badge badge-outline">{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {err && <div className="text-error text-sm mt-2">{err}</div>}
        </div>
      </div>

      {/* Formular */}
      <div className="card bg-base-100 shadow">
        <form onSubmit={addUser} className="card-body space-y-3">
          <h2 className="card-title">Neuen Benutzer anlegen</h2>

          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="input input-bordered w-full"
            required
          />

          <input
            type="password"
            placeholder="Passwort"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input input-bordered w-full"
            required
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="select select-bordered w-full"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          <button className="btn btn-primary mt-2">
            ➕ Speichern
          </button>

          {err && <div className="text-error text-sm">{err}</div>}
        </form>
      </div>
    </section>
  );
}
