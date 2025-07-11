// client/src/pages/UserManagement.jsx
import { useEffect, useState } from "react";

const token = localStorage.getItem("token");

export default function UserManagement() {
  const [list,  setList ]  = useState([]);
  const [name,  setName ]  = useState("");
  const [role,  setRole ]  = useState("user");
  const [pass,  setPass ]  = useState("");
  const [err,   setErr  ]  = useState("");

  const hdr = {
    "Content-Type":"application/json",
    Authorization: `Bearer ${token}`
  };

  /* ---------- laden ---------- */
  const load = () =>
    fetch("/api/admin/users", { headers: hdr })
      .then(r=>r.json()).then(setList)
      .catch(()=> setErr("Konnte Userliste nicht laden"));

  useEffect(load, []);

  /* ---------- neu anlegen ---------- */
  async function create(e) {
    e.preventDefault();
    try {
      const body = JSON.stringify({ username:name, password:pass || "changeme", role });
      const res  = await fetch("/api/admin/users", { method:"POST", headers: hdr, body });
      if (!res.ok) throw new Error("Fehler beim Anlegen");
      setName(""); setPass(""); setRole("user");
      load();
    } catch(e){ alert(e.message); }
  }

  /* ---------- Passwort reset ---------- */
  const resetPw = async id => {
    const ok = confirm("Passwort auf 'changeme' zurücksetzen?");
    if (!ok) return;
    await fetch(`/api/admin/users/${id}/reset`, { method:"PUT", headers: hdr });
    alert("Passwort wurde zurückgesetzt: changeme");
  };

  /* ---------- Rolle umschalten ---------- */
  const toggleRole = async (id, cur) => {
    const newRole = cur==="admin" ? "user" : "admin";
    await fetch(`/api/admin/users/${id}`, {
      method:"PUT", headers:hdr,
      body: JSON.stringify({ role:newRole })
    });
    load();
  };

  /* ---------- löschen ---------- */
  const delUser = async id => {
    if (!confirm("User wirklich löschen?")) return;
    await fetch(`/api/admin/users/${id}`, { method:"DELETE", headers:hdr });
    load();
  };

  /* ---------- UI ---------- */
  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      {/* Neuen User anlegen */}
      <form onSubmit={create} className="card bg-base-200 shadow p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Neuer Benutzer</h2>
        <input
          required placeholder="Username"
          className="input input-bordered"
          value={name} onChange={e=>setName(e.target.value)}
        />
        <input
          placeholder="Passwort (optional)"
          className="input input-bordered"
          value={pass} onChange={e=>setPass(e.target.value)}
        />
        <select className="select select-bordered"
                value={role} onChange={e=>setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn btn-primary self-start">Anlegen</button>
      </form>

      {/* Userliste */}
      {err && <p className="text-error">{err}</p>}
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>User</th><th>Rolle</th><th>Aktionen</th></tr></thead>
          <tbody>
            {list.map(u=>(
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>
                  <span className={`badge badge-${u.role==="admin"?"warning":"neutral"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button className="btn btn-xs" onClick={()=>toggleRole(u.id,u.role)}>
                    Rolle ↺
                  </button>
                  <button className="btn btn-xs btn-info" onClick={()=>resetPw(u.id)}>
                    PW reset
                  </button>
                  <button className="btn btn-xs btn-error" onClick={()=>delUser(u.id)}>
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
