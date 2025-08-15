// client/src/components/NavBar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth";

export default function NavBar() {
  const nav = useNavigate();
  const loc = useLocation();
  const [auth, setAuth] = useState(() => {
    try { return getAuth(); } catch { return { token: null, role: null }; }
  });

  useEffect(() => {
    try { setAuth(getAuth()); } catch {}
  }, [loc.pathname]);

  useEffect(() => {
    const fn = () => {
      try { setAuth(getAuth()); } catch {}
    };
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  const linkCls = (p) => {
    const active = loc.pathname.startsWith(p);
    return [
      "px-3 py-2 rounded transition-colors",
      "text-gray-200 hover:text-white",
      "hover:bg-white/10",
      active ? "font-semibold bg-white/10" : "text-gray-300"
    ].join(" ");
  };

  const logout = () => {
    try { localStorage.removeItem("token"); } catch {}
    try { sessionStorage.removeItem("token"); } catch {}
    setAuth({ token: null, role: null });
    nav("/login");
  };

  return (
    <nav className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-[#0b1220] text-gray-200 sticky top-0 z-10">
      {auth?.token ? (
        <>
          {/* Für alle (user + admin) */}
          <Link to="/boxes" className={linkCls("/boxes")}>Boxen</Link>

          {/* Admin-spezifisch (additiv) */}
          {auth.role === "admin" && (
            <>
              <Link to="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
              <Link to="/boxesmanage" className={linkCls("/boxesmanage")}>Box‑Pflege</Link>
              <Link to="/usermanagement" className={linkCls("/usermanagement")}>Users</Link>
              <Link to="/backuprestore" className={linkCls("/backuprestore")}>Backup</Link>
              <Link to="/admin/boxes" className={linkCls("/admin/boxes")}>DB‑Editor</Link>
            </>
          )}

          <button
            onClick={logout}
            className="ml-auto px-2 py-1 rounded text-gray-300 hover:text-white hover:bg-white/10"
          >
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" className="ml-auto underline hover:no-underline">Login</Link>
      )}
    </nav>
  );
}
