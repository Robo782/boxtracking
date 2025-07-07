// client/src/pages/UserManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function UserManagement() {
  const nav  = useNavigate();
  const role = localStorage.getItem("role");
  const cfg  = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  /* Nicht-Admin? → Übersicht */
  useEffect(() => { if (role !== "admin") nav("/boxes"); }, [role, nav]);

  const [users, setUsers] = useState([]);
  const [form,  setForm ] = useState({ username:"", password:"", role:"user" });
  const [err ,  setErr  ] = useState("");

  /* ---------- Benutzer laden ---------- */
  const loadUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/users", cfg);
      setUsers(data);
    } catch (e) {
      console.error(e);
      setErr("⚠️ Benutzer konnten nicht geladen werden");
    }
  };
  useEffect(() => { loadUsers(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Benutzer anlegen ---------- */
  const addUser = async (e) => {
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

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      {/* Kopfzeile: Titel + Zurück */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1>👥 Benutzerverwaltung</h1>
        <Link to="/boxes">
          <button style={{ padding:"6px 12px" }}>⇦ Zur Übersicht</button>
        </Link>
      </div>

      {/* Tabelle */}
      <table border="1" cellPadding="6" style={{ width:"100%", borderCollapse:"collapse", marginTop:20 }}>
        <thead style={{ background:"#f0f0f0" }}>
          <tr><th>ID</th><th>Username</th><th>Rolle</th></tr>
        </thead>
        <tbody>
          {users.map(u=>(
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={3} style={{ textAlign:"center" }}>Keine Benutzer vorhanden</td></tr>
          )}
        </tbody>
      </table>

      {/* Formular */}
      <form onSubmit={addUser} style={{ marginTop: 30 }}>
        <h3>Neuen Benutzer anlegen</h3>
        <input
          required
          placeholder="Username"
          value={form.username}
          onChange={e=>setForm({...form, username:e.target.value})}
          style={{ width:"100%", padding:6, marginBottom:8 }}
        />
        <input
          required
          type="password"
          placeholder="Passwort"
          value={form.password}
          onChange={e=>setForm({...form, password:e.target.value})}
          style={{ width:"100%", padding:6, marginBottom:8 }}
        />
        <select
          value={form.role}
          onChange={e=>setForm({...form, role:e.target.value})}
          style={{ width:"100%", padding:6, marginBottom:12 }}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button style={{ padding:"6px 12px" }}>➕ Speichern</button>
        {err && <p style={{ color:"red", marginTop:8 }}>{err}</p>}
      </form>
    </div>
  );
}
