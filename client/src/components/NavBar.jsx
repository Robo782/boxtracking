import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

/* JWT-Payload kurz decodieren */
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export default function NavBar() {
  /* Erstes Rendern:  role aus localStorage  ODER  aus dem Token ziehen */
  const [role, setRole] = useState(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) return storedRole;

    const token = localStorage.getItem("token");
    return token ? parseJwt(token).role ?? null : null;
  });

  const nav = useNavigate();

  /* Reagiert auf Änderungen in localStorage (z. B. Logout in anderem Tab) */
  useEffect(() => {
    const handler = () => setRole(localStorage.getItem("role"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* Logout-Button */
  const handleLogout = () => {
    localStorage.clear();
    setRole(null);                  // sofortiger Re-Render
    nav("/login", { replace: true });
  };

  /* Wenn noch kein role vorhanden: nichts anzeigen (Login-Screen) */
  if (!role) return null;

  return (
    <div className="navbar bg-base-300 px-4 shadow">
      <Link to="/" className="font-bold text-lg">
        Device&nbsp;Box&nbsp;Tracker
      </Link>

      <div className="ml-auto flex items-center gap-4">
        {role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/boxes">Box-Pflege</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/backup">Backup</Link>
          </>
        )}

        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
