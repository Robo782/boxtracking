import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/utils/api";

export default function UserManagement() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ username:"", password:"", role:"user" });
  const [err , setErr ] = useState("");

  const load = () =>
    apiGet("/api/admin/users")
      .then(setList)
      .catch(e => setErr(e.message));

  useEffect(load, []);

  const create = async e => {
    e.preventDefault();
    await apiPost("/api/admin/users", {
      username: form.username,
      password: form.password || "changeme",
      role    : form.role
    });
    setForm({ username:"", password:"", role:"user" });
    load();
  };

  const resetPw   = id => window.confirm("PW auf 'changeme' setzen?") &&
                          apiPut(`/api/admin/users/${id}/reset`).then(load);

  const toggleRole= (id, cur) => apiPut(`/api/admin/users/${id}`, {
                          role: cur === "admin" ? "user" : "admin"
                        }).then(load);

  const delUser   = id => window.confirm("User wirklich löschen?") &&
                          apiDelete(`/api/admin/users/${id}`).then(load);

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      <form onSubmit={create} className="space-y-2">
        <input value={form.username} required placeholder="Username"
               onChange={e=>setForm({...form,username:e.target.value})}
               className="input input-bordered w-full" />
        <input value={form.password} type="password" placeholder="Passwort (optional)"
               onChange={e=>setForm({...form,password:e.target.value})}
               className="input input-bordered w-full" />
        <select value={form.role}
                onChange={e=>setForm({...form,role:e.target.value})}
                className="select select-bordered w-full">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn btn-primary w-full">Anlegen</button>
      </form>

      {err && <p className="text-error">{err}</p>}

      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>User</th><th>Rolle</th><th>Aktionen</th></tr></thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td className="space-x-1">
                  <button onClick={()=>toggleRole(u.id,u.role)}
                          className="btn btn-xs">Rolle ↺</button>
                  <button onClick={()=>resetPw(u.id)}
                          className="btn btn-xs">PW-Reset</button>
                  <button onClick={()=>delUser(u.id)}
                          className="btn btn-error btn-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
