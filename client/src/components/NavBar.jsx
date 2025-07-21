import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth.js";

export default function NavBar() {
  const loc      = useLocation();
  const nav      = useNavigate();
  const [role, setRole] = useState(() => getAuth().role);

  /* Rolle aktualisieren, wenn in anderem Tab ausgeloggt wurde */
  useEffect(() => {
    const fn = () => setRole(getAuth().role);
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  /* Nach jedem Route-Wechsel Rolle frisch lesen (relevant nach Login) */
  useEffect(() => { setRole(getAuth().role); }, [loc.pathname]);

  const logout = () => {
  localStorage.removeItem("token");   //  ⬅️  wichtig!
  // optional: alte Keys aus Vorgängerversionen entsorgen
  localStorage.removeItem("role");
  setRole(null);
  nav("/login", { replace: true });
};


  if (!role) return null;           // nicht eingeloggt → keine NavBar

  const linkCls = (p) =>
    `px-2 underline-offset-4 hover:underline ${
      loc.pathname.startsWith(p) ? "font-bold underline" : ""
    }`;

  return (
    <nav className="flex gap-4 p-2 border-b items-center">
      <span className="font-semibold text-lg">Device Box Tracker</span>

      <Link to="/boxes" className={linkCls("/boxes")}>Boxen</Link>

      {role === "admin" && (
        <>
          <Link to="/dashboard"      className={linkCls("/dashboard")}>Dashboard</Link>
          <Link to="/boxesmanage"    className={linkCls("/boxesmanage")}>Box-Pflege</Link>
          <Link to="/usermanagement" className={linkCls("/usermanagement")}>Users</Link>
          <Link to="/backuprestore"  className={linkCls("/backuprestore")}>Backup</Link>
        </>
      )}

      <button onClick={logout} className="ml-auto px-2 underline hover:no-underline">
        Logout
      </button>
    </nav>
  );
}
