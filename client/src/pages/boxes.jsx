import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/utils/api";
import FilterBar  from "@/components/FilterBar";

export default function Boxes() {
  const [boxes, setBoxes] = useState([]);
  const [err,   setErr]   = useState("");
  const [stat,  setStat]  = useState("all");
  const [type,  setType]  = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiGet("/api/boxes")
      .then(setBoxes)
      .catch(e => setErr(String(e)));
  }, []);

  const list = useMemo(() => boxes.filter(b => {
    const q = query.toLowerCase();
    return (stat  === "all" || b.status === stat) &&
           (type  === "all" || b.type   === type) &&
           (!q || b.serial.toLowerCase().includes(q) ||
                  (b.deviceSerial ?? "").toLowerCase().includes(q));
  }), [boxes, stat, type, query]);

  const role = localStorage.getItem("role");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Übersicht <span className="opacity-60">{list.length}/{boxes.length}</span>
      </h1>

      <FilterBar {...{query,setQuery,stat,setStat,type,setType}} />

      {err && <p className="text-error">{err}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(b => (
          <div key={b.id} className="card bg-base-300 shadow">
            <div className="card-body p-4">
              <h2 className="card-title">{b.serial}</h2>
              <p>Status: <span className="font-mono">{b.status}</span></p>
              <p>Cycles: {b.cycles}</p>
              <p>Device: {b.device ?? "—"}</p>
              <div className="card-actions mt-2">
                <a href={`/boxes/${b.id}`} className="link">Details</a>
                {role === "admin" && (
                  <a href={`/admin/boxes/${b.id}`} className="link">Manage</a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
