import { useEffect, useState } from "react";

export default function UserManagement() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("user");
  const [err , setErr ] = useState("");

  /* Header immer frisch mit aktuellem Token */
  const hdr = () => ({
    "Content-Type": "application/json",
    Authorization : `Bearer ${localStorage.getItem("token")}`,
  });

  /* ---------- Liste ---------- */
  const load = () =>
    fetch("/api/admin/users", { headers: hdr() })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => setErr("Konnte Userliste nicht laden"));
  useEffect(load, []);

  /* ---------- anlegen ---------- */
  async function create(e) {
    e.preventDefault();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify({
        username: name,
        password: pass || "changeme",
        role,
      }),
    });
    setName(""); setPass(""); setRole("user"); load();
  }

  /* ---------- Aktionen ---------- */
  const resetPw = id =>
    confirm("PW auf 'changeme' setzen?") &&
      fetch(`/api/admin/users/${id}/reset`, { method:"PUT", headers: hdr() });

  const toggleRole = (id, cur) =>
    fetch(`/api/admin/users/${id}`, {
      method :"PUT",
      headers: hdr(),
      body   : JSON.stringify({ role: cur === "admin" ? "user" : "admin" }),
    }).then(load);

  const delUser = id =>
    confirm("User wirklich löschen?") &&
      fetch(`/api/admin/users/${id}`, { method:"DELETE", headers: hdr() })
        .then(load);

  /* ---------- UI ---------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      <form onSubmit={create} className="card bg-base-100 p-4 max-w-md space-y-4">
        <h2 className="font-semibold">Neuer Benutzer</h2>

        <input className="input input-bordered w-full"
               placeholder="Username" value={name}
               onChange={e=>setName(e.target.value)} required />

        <input className="input input-bordered w-full"
               placeholder="Passwort (optional)" type="password"
               value={pass} onChange={e=>setPass(e.target.value)} />

        <select className="select select-bordered w-full"
                value={role} onChange={e=>setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>

        <button className="btn btn-primary w-full">Anlegen</button>
      </form>

      {err && <p className="text-error">{err}</p>}

      <table className="table">
        <thead><tr><th>User</th><th>Rolle</th><th>Aktionen</th></tr></thead>
        <tbody>
          {list.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td className="flex gap-2">
                <button onClick={()=>toggleRole(u.id,u.role)} className="btn btn-xs">Rolle ↺</button>
                <button onClick={()=>resetPw(u.id)}        className="btn btn-xs">PW-Reset</button>
                <button onClick={()=>delUser(u.id)}        className="btn btn-error btn-xs">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
