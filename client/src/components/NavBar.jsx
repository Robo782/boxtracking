import { Link, useNavigate, useLocation } from "react-router-dom";

/* Hilfsfunktion: Rolle aus dem JWT lesen */
function getRole() {
  // 1) explizit gespeicherter Wert (falls Login.jsx das setzt)
  const stored = localStorage.getItem("role");
  if (stored) return stored;

  // 2) sonst Token-Payload auslesen
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1])).role ?? null;
  } catch {
    return null;
  }
}

export default function NavBar() {
  const nav = useNavigate();
  /* `useLocation()` sorgt dafür, dass die NavBar bei jedem Routenwechsel neu rendert */
  useLocation();   // der Rückgabewert ist hier egal

  const role  = getRole();
  const token = localStorage.getItem("token");

  /* Wenn kein Token da ist (vor dem Login), gar keine Leiste anzeigen */
  if (!token) return null;

  const logout = () => {
    localStorage.clear();
    nav("/login", { replace: true });
  };

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
