import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/* JWT-Payload kurz dekodieren */
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export default function NavBar() {
  /* 1) initial: Rolle aus LocalStorage oder direkt aus dem Token holen */
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem("role");
    if (saved) return saved;

    const token = localStorage.getItem("token");
    return token ? parseJwt(token).role ?? null : null;
  });

  const nav = useNavigate();

  /* 2) reagiert auf Änderungen aus anderen Tabs/Fenstern */
  useEffect(() => {
    const h = () => setRole(localStorage.getItem("role"));
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  /* 3) Logout */
  const logout = () => {
    localStorage.clear();
    setRole(null);
    nav("/login", { replace: true });
  };

  if (!role) return null; // Login-Seite → keine Leiste

  return (
    <div className="navbar bg-base-300 px-4 shadow">
      <Link to="/" className="font-bold text-lg">
        Device&nbsp;Box&nbsp;Tracker
      </Link>

      <div className="ml-auto flex gap-4 items-center">
        {role === "admin" && (
          <>
            <Link to="/admin"          className="link">Dashboard</Link>
            <Link to="/boxmanage"      className="link">Box-Pflege</Link>
            <Link to="/usermanagement" className="link">Users</Link>
            <Link to="/backuprestore"  className="link">Backup</Link>
          </>
        )}

        <button onClick={logout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}
