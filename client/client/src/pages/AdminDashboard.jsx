// client/src/pages/AdminDashboard.jsx
import { Link, useNavigate } from "react-router-dom";
import ResetDatabaseButton from "../components/ResetDatabaseButton";
import SeedBoxesButton     from "../components/SeedBoxesButton";

export default function AdminDashboard() {
  const role = localStorage.getItem("role");
  const nav  = useNavigate();

  /* Nur Admin darf hier bleiben */
  if (role !== "admin") {
    nav("/boxes");          // sofort zurück zur Übersicht
    return null;
  }

  return (
    <div className="p-6">
      {/* Kopfzeile mit Zurück-Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔧 Admin-Bereich</h1>

        {/* Zur Übersicht */}
        <Link
          to="/boxes"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          ⇦ Zur Übersicht
        </Link>
      </div>

      {/* Links & Aktionen */}
      <div className="space-y-6">
        <Link to="/admin/users" className="underline text-blue-600 block">
          👥 Benutzerverwaltung öffnen
        </Link>

        <div className="flex gap-4">
          <ResetDatabaseButton />
          <SeedBoxesButton />
        </div>
      </div>
    </div>
  );
}
