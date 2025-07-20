import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NavBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  // reagiert auf storage-Events (Logout in anderem Tab)
  useEffect(() => {
    const handler = () => setRole(localStorage.getItem("role"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // bei jedem Routewechsel Rolle frisch lesen (falls Login grad passiert ist)
  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, [loc.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    nav("/login", { replace: true });
  };

  if (!role) return null; // nicht eingeloggt → keine Nav

  const linkCls = (p) =>
    `px-2 underline-offset-4 hover:underline ${
      loc.pathname.startsWith(p) ? "font-bold underline" : ""
    }`;

  return (
    <div className="navbar bg-base-300 px-4 shadow">
      <Link to="/" className="font-bold text-lg">
        Device Box Tracker
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {role === "admin" && (
          <>
            <Link className={linkCls("/admin")}         to="/admin">Dashboard</Link>
            <Link className={linkCls("/boxmanage")}     to="/boxmanage">Box-Pflege</Link>
            <Link className={linkCls("/usermanagement")}to="/usermanagement">Users</Link>
            <Link className={linkCls("/backuprestore")} to="/backuprestore">Backup</Link>
          </>
        )}
        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
