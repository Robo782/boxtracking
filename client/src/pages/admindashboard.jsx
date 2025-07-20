import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err  , setErr  ] = useState("");

  useEffect(() => {
    apiGet("/api/admin/stats")
      .then(setStats)
      .catch(e => setErr(e.message));
  }, []);

  if (err)     return <p className="m-4 text-error">{err}</p>;
  if (!stats)  return <p className="m-4">Loading …</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <ul className="menu bg-base-200 rounded-box">
        <li>Total Boxes:   {stats.boxes}</li>
        <li>Total Users:   {stats.users}</li>
        <li>Active Loans:  {stats.loans}</li>
      </ul>
    </div>
  );
}
