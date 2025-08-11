import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth.js";

export default function NavBar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => { setAuth(getAuth()); }, [loc.pathname]);
  useEffect(() => {
    const fn = () => setAuth(getAuth());
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setAuth(getAuth());
    nav("/login", { replace: true });
  };

  const linkCls = (path) =>
    `px-2 py-1 rounded hover:bg-base-200 ${loc.pathname.startsWith(path) ? "font-semibold" : ""}`;

  return (
    <nav className="navbar bg-base-100 border-b border-base-300 gap-3 px-4">
      <Link to="/boxes" className="text-lg font-semibold">Device Box Tracker</Link>

      <Link to="/boxes" className={linkCls("/boxes")}>Boxen</Link>

      {/* Admin-Links nur wenn Role=admin */}
      {auth?.role === "admin" && (
        <>
          <Link to="/dashboard"      className={linkCls("/dashboard")}>Dashboard</Link>
          <Link to="/boxesmanage"    className={linkCls("/boxesmanage")}>Box-Pflege</Link>
          <Link to="/usermanagement" className={linkCls("/usermanagement")}>Users</Link>
          <Link to="/backuprestore"  className={linkCls("/backuprestore")}>Backup</Link>
          <Link to="/admin/boxes"    className={linkCls("/admin/boxes")}>DB‑Editor</Link> {/* ⬅️ NEU */}
        </>
      )}

      <button onClick={logout} className="ml-auto px-2 underline hover:no-underline">
        Logout
      </button>
    </nav>
  );
}
