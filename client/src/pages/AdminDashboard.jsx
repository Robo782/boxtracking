import { Link, useNavigate } from "react-router-dom";
import ResetDatabaseButton from "../components/ResetDatabaseButton";
import SeedBoxesButton from "../components/SeedBoxesButton";

export default function AdminDashboard() {
  const role = localStorage.getItem("role");
  const nav = useNavigate();

  if (role !== "admin") {
    nav("/boxes");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">🛠️ Admin-Bereich</h1>
        <Link
          to="/boxes"
          className="mt-4 sm:mt-0 inline-block bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded shadow"
        >
          ↩ Zur Übersicht
        </Link>
      </div>

      {/* Links & Aktionen */}
      <div className="space-y-6 text-gray-800">

        {/* Benutzerverwaltung */}
        <Link
          to="/admin/users"
          className="block bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-4 py-3 rounded transition"
        >
          👥 Benutzerverwaltung öffnen
        </Link>

        {/* Backup/Restore */}
        <Link
          to="/admin/backup"
          className="block bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-4 py-3 rounded transition"
        >
          💾 DB Backup / Restore
        </Link>

        {/* Aktions-Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ResetDatabaseButton />
          <SeedBoxesButton />
        </div>
      </div>
    </div>
  );
}
