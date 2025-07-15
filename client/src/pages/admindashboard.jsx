/* client/src/pages/admindashboard.jsx */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/stats",
          { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error();
        setStats(await res.json());
      } catch {
        /* Fallback-Werte */
        setStats({
          boxes_total: "—",
          boxes_onTour:"—",
          boxes_pending:"—",
          users:"—",
          last_backup:"—",
        });
      }
    })();
  }, []);

  if (!stats) return <p className="p-6">Lade …</p>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin-Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Boxen gesamt"  val={stats.boxes_total} />
        <Stat label="Unterwegs"     val={stats.boxes_onTour} />
        <Stat label="Ungeprüft"     val={stats.boxes_pending} />
        <Stat label="User"          val={stats.users} />
        <Stat label="Letztes Backup" val={stats.last_backup} wide />
      </div>

      <div className="flex flex-wrap gap-4">
        <Link to="/boxmanage"      className="btn">Box-Pflege</Link>
        <Link to="/usermanagement" className="btn btn-primary">Benutzer</Link>
        <Link to="/backuprestore"  className="btn btn-secondary">Backup</Link>
      </div>
    </div>
  );
}

function Stat({ label, val, wide=false }) {
  return (
    <div className={`card bg-base-100 shadow ${wide ? "sm:col-span-2" : ""}`}>
      <div className="card-body p-4">
        <p className="text-sm opacity-60">{label}</p>
        <p className="text-2xl font-bold">{val}</p>
      </div>
    </div>
  );
}
