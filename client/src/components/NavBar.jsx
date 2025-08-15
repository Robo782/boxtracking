// client/src/components/NavBar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth";

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

  const linkCls = (p) =>
    `px-3 py-2 hover:bg-gray-100 rounded ${loc.pathname.startsWith(p) ? "font-semibold" : ""}`;

  const logout = () => {
    localStorage.removeItem("token");
    setAuth({ token: null, role: null, valid: false });
    nav("/login");
  };

  return (
    <nav className="flex items-center gap-2 px-4 py-2 border-b bg-white sticky top-0 z-10">
      {auth?.token ? (
        <>
          {/* Für alle (user + admin) */}
          <Link to="/boxes" className={linkCls("/boxes")}>Boxen</Link>

          {/* Admin-spezifische Menüpunkte (additiv) */}
          {auth.role === "admin" && (
            <>
              <Link to="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
              <Link to="/boxesmanage" className={linkCls("/boxesmanage")}>Box-Pflege</Link>
              <Link to="/usermanagement" className={linkCls("/usermanagement")}>Users</Link>
              <Link to="/backuprestore" className={linkCls("/backuprestore")}>Backup</Link>
              <Link to="/admin/boxes" className={linkCls("/admin/boxes")}>DB‑Editor</Link>
            </>
          )}

          <button onClick={logout} className="ml-auto px-2 underline hover:no-underline">
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" className="ml-auto underline">Login</Link>
      )}
    </nav>
  );
}
