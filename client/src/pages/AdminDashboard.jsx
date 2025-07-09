// client/src/pages/AdminDashboard.jsx
import { Link, useNavigate } from "react-router-dom";
import ResetDatabaseButton from "../components/ResetDatabaseButton";
import SeedBoxesButton     from "../components/SeedBoxesButton";

export default function AdminDashboard() {
  const role = localStorage.getItem("role");
  const nav  = useNavigate();

  if (role !== "admin") {
    nav("/boxes");
    return null;
  }

  return (
    <section className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">⚙️ Admin-Dashboard</h1>
        <button onClick={() => nav("/boxes")} className="btn btn-sm">
          ↩ Übersicht
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/users" className="card bg-base-100 shadow hover:shadow-lg">
          <div className="card-body items-center">
            <h2 className="card-title">👥 Benutzerverwaltung</h2>
            <p>Neue Benutzer anlegen und Rollen vergeben.</p>
          </div>
        </Link>

        <Link to="/admin/boxes" className="card bg-base-100 shadow hover:shadow-lg">
          <div className="card-body items-center">
            <h2 className="card-title">📦 Box-Verwaltung</h2>
            <p>Status & Felder aller Kisten editieren.</p>
          </div>
        </Link>

        <Link to="/admin/backup" className="card bg-base-100 shadow hover:shadow-lg">
          <div className="card-body items-center">
            <h2 className="card-title">💾 Backup / Restore</h2>
            <p>SQLite sichern & wiederherstellen.</p>
          </div>
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body flex flex-wrap gap-3">
          <ResetDatabaseButton className="btn btn-error"/>
          <SeedBoxesButton     className="btn btn-primary"/>
        </div>
      </div>
    </section>
  );
}
