import { useState } from "react";
import useAbortableFetch from "@/hooks/useAbortableFetch";
import api from "@/utils/api";

export default function AdminDashboard() {
  const [stats,setStats] = useState(null);
  const [err  ,setErr  ] = useState("");

  useAbortableFetch(signal=>{
    api.get("/admin/overview",{signal})
       .then(setStats)
       .catch(e=>e.name!=="AbortError" && setErr("Konnte Daten nicht laden"));
  });

  if(err)    return <p className="p-6 text-error">{err}</p>;
  if(!stats) return <p className="p-6">Lade …</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin-Dashboard</h1>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Boxen gesamt</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Zyklen heute</div>
          <div className="stat-value">{stats.cyclesToday}</div>
        </div>
      </div>
    </div>
  );
}
