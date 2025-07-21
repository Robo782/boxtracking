import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth.js";

export default function NavBar() {
  const nav = useNavigate();
  const loc = useLocation();

  const [auth, setAuth] = useState(getAuth());

  /* Bei Routenwechsel Auth neu prüfen */
  useEffect(() => { setAuth(getAuth()); }, [loc.pathname]);

  /* Token kann in anderem Tab gelöscht werden */
  useEffect(() => {
    const fn = () => setAuth(getAuth());
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);

  if (!auth.valid) return null;          // ohne JWT keinerlei NavBar

  const { role } = auth;

  const logout = () => {
  localStorage.removeItem("token");
  /*  👇 App neu informieren */
  window.dispatchEvent(new Event("authchange"));

  nav("/login", { replace: true });
};
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
