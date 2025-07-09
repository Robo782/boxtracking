// client/src/pages/UserManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link }   from "react-router-dom";
import axios                   from "axios";

export default function UserManagement() {
  /* ───────────────── Auth / Header ───────────────── */
  const nav   = useNavigate();
  const role  = localStorage.getItem("role");
  const cfg   = { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` } };

  /* ───────────────── Guards ───────────────── */
  useEffect(()=>{ if (role !== "admin") nav("/boxes"); }, [role, nav]);

  /* ───────────────── State ───────────────── */
  const [users,setUsers]             = useState([]);
  const [form ,setForm ]             = useState({ username:"", password:"", role:"user" });
  const [err  ,setErr  ]             = useState("");

  /* ---------- Benutzer laden ---------- */
  const loadUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/users", cfg);
      setUsers(data);
    } catch { setErr("⚠️ Benutzer konnten nicht geladen werden"); }
  };
  useEffect(()=>{ loadUsers(); }, []);     // once on mount

  /* ---------- Benutzer anlegen ---------- */
  const addUser = async e => {
    e.preventDefault();
    setErr("");
    try {
      await axios.post("/api/admin/users", form, cfg);
      setForm({ username:"", password:"", role:"user" });
      loadUsers();
    } catch (e) {
      setErr(e.response?.data?.error || "Fehler beim Speichern");
    }
  };

  /* ───────────────── UI ───────────────── */
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6">
      {/* Kopfzeile */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-white">👥 Benutzerverwaltung</h1>
        <Link
          to="/boxes"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
        >
          ↩ Zur&nbsp;Übersicht
        </Link>
      </div>

      {/* Haupt-Card */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Tabelle */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 overflow-auto">
          <h2 className="text-xl font-medium text-white mb-4">Bestehende&nbsp;Benutzer</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-100">
              <thead>
                <tr className="bg-white/10 uppercase text-xs tracking-wider">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Rolle</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="odd:bg-white/5 even:bg-white/0">
                    <td className="px-3 py-1">{u.id}</td>
                    <td className="px-3 py-1">{u.username}</td>
                    <td className="px-3 py-1">{u.role}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                      Keine Benutzer vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {err && <p className="mt-4 text-red-400">{err}</p>}
        </div>

        {/* Formular */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Neuen&nbsp;Benutzer&nbsp;anlegen</h2>

          <form onSubmit={addUser} className="space-y-4">
            <input
              required
              className="w-full px-4 py-2 rounded bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              value={form.username}
              onChange={e=>setForm({ ...form, username:e.target.value })}
            />
            <input
              required
              type="password"
              className="w-full px-4 py-2 rounded bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Passwort"
              value={form.password}
              onChange={e=>setForm({ ...form, password:e.target.value })}
            />
            <select
              className="w-full px-4 py-2 rounded bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role}
              onChange={e=>setForm({ ...form, role:e.target.value })}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>

            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition"
            >
              ➕ Speichern
            </button>

            {err && <p className="text-red-400 text-sm">{err}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
