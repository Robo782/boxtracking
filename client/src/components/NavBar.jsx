// client/src/components/NavBar.jsx
import { Link } from "react-router-dom";

export default function NavBar() {
  const role = localStorage.getItem("role");
  if (!role) return null;                   // während Login nichts anzeigen

  return (
    <div className="navbar bg-base-200 shadow">
      <Link to="/boxes" className="btn btn-ghost text-xl">Device Box Tracker</Link>
      <div className="flex-1" />
      {role==="admin" && (
        <div className="flex gap-2">
          <Link className="btn btn-ghost" to="/admin">Dashboard</Link>
          <Link className="btn btn-ghost" to="/admin/boxes">Box-Pflege</Link>
          <Link className="btn btn-ghost" to="/admin/users">Users</Link>
          <Link className="btn btn-ghost" to="/admin/backup">Backup</Link>
        </div>
      )}
      <button onClick={() => {localStorage.clear(); location.href="/login";}}
              className="btn btn-outline btn-sm ml-4">
        Logout
      </button>
    </div>
  );
}
