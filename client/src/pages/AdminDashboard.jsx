// client/src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link }                from "react-router-dom";

const token = localStorage.getItem("token");

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Stats-API fehlt");
        setStats(await res.json());
      } catch {
        // Fallback-Mock, falls Endpoint (noch) nicht existiert
        setStats({
          boxes_total:   "—",
          boxes_onTour:  "—",
          boxes_pending: "—",
          users:         "—",
          last_backup:   "—",
        });
      }
    })();
  }, []);

  if (!stats) return <p className="p-4">Lade …</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stat-Kacheln ------------------------------------------------ */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <Stat label="Kisten gesamt"  val={stats.boxes_total}   icon="📦"  />
        <Stat label="Unterwegs"      val={stats.boxes_onTour}  icon="🚚"  />
        <Stat label="Rücklauf offen" val={stats.boxes_pending} icon="↩️"  />
        <Stat label="Benutzer"       val={stats.users}         icon="👤"  />
        <Stat label="Letztes Backup" val={stats.last_backup}   icon="💾" wide />
      </div>

      {/* Schnellzugriff-Buttons ------------------------------------ */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Link className="btn btn-primary"  to="/admin/boxes">Box-Pflege</Link>
        <Link className="btn btn-secondary"to="/admin/users">User Mgmt</Link>
        <Link className="btn btn-accent"   to="/admin/backup">Backup / Restore</Link>
      </div>
    </div>
  );
}

/* Mini-Card-Komponente ------------------------------------------- */
function Stat({ label, val, icon, wide=false }) {
  return (
    <div className={`card bg-base-200 shadow ${wide ? "col-span-2" : ""}`}>
      <div className="card-body p-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm opacity-70">{label}</p>
            <p className="text-xl font-bold">{val}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
