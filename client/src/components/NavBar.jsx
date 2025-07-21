import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../utils/auth.js";

export default function NavBar() {
  const nav = useNavigate();
  const loc = useLocation();

  // aktueller Auth-Status
  const [auth, setAuth] = useState(getAuth());

  /* Änderungen an Route → Auth nochmal prüfen */
  useEffect(() => { setAuth(getAuth()); }, [loc.pathname]);

  /* Token kann in anderem Tab gelöscht werden → storage-Event auffangen */
  useEffect(() => {
    const onStorage = () => setAuth(getAuth());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Wenn Token ungültig oder weg → gar keine NavBar */
  if (!auth.valid) return null;

  const { role } = auth;

  const logout = () => {
    localStorage.removeItem("token");      // einzig relevante Key
    localStorage.removeItem("role");       // Altlast aus früherer Version
    setAuth({ role: null, valid: false }); // NavBar sofort verstecken
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
