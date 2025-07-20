import { useState } from "react";
import useAbortableFetch from "@/hooks/useAbortableFetch";
import api from "@/utils/api";

export default function UserManagement() {
  const [list,setList] = useState([]);
  const [err ,setErr ] = useState("");

  const load = (signal)=>api.get("/admin/users",{signal}).then(setList);

  useAbortableFetch(signal=>{
    load(signal).catch(e=>e.name!=="AbortError" && setErr("Konnte Userliste nicht laden"));
  });

  const add = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    api.post("/admin/users",data)
       .then(load)
       .catch(()=>alert("Fehler beim Anlegen"));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>

      <form onSubmit={add} className="card w-80 bg-base-200 p-4 space-y-3">
        <input name="user" className="input input-bordered w-full" placeholder="Username" required />
        <input name="pass" className="input input-bordered w-full" placeholder="Passwort (optional)" />
        <select name="role" className="select select-bordered w-full">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn btn-primary w-full">Anlegen</button>
      </form>

      {err && <p className="text-error">{err}</p>}

      <table className="table">
        <thead><tr><th>User</th><th>Rolle</th><th /></tr></thead>
        <tbody>
          {list.map(u=>(
            <tr key={u.user}>
              <td>{u.user}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-xs"
                        onClick={()=>api.del(`/admin/users/${u.user}`).then(load)}>
                  löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
