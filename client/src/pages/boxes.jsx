import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import FilterBar from "../components/FilterBar.jsx";
import { api } from "../utils/api.js";

export default function Boxes() {
  const [boxes, setBoxes] = useState([]);
  const [query, setQuery] = useState("");
  const [stat , setStat ] = useState("all");
  const [type , setType ] = useState("all");
  const [err  , setErr  ] = useState("");

  useEffect(() => {
    api("/api/boxes")
      .then(r => r.json())
      .then(setBoxes)
      .catch(e => setErr(String(e)));
  }, []);

  const list = useMemo(() => boxes.filter(b => {
    const q = query.toLowerCase();
    return (stat==="all" || b.status===stat) &&
           (type==="all" || b.type  ===type) &&
           (q==="" ||
            b.serial.toLowerCase().includes(q) ||
            (b.deviceSerial ?? "").toLowerCase().includes(q));
  }), [boxes, stat, type, query]);

  const role = localStorage.getItem("role");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Übersicht <span className="opacity-60">{list.length}/{boxes.length}</span>
      </h1>

      <FilterBar {...{query,setQuery,stat:setStat,type:setType}} />

      {err && <p className="text-error">{err}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(b => (
          <div key={b.id} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h2 className="card-title">
                {b.serial} <span className="text-sm opacity-60">({b.type})</span>
              </h2>
              <ul className="text-sm">
                <li>Status: {b.status}</li>
                <li>Cycles: {b.cycles}</li>
                <li>Device: {b.deviceSerial || "—"}</li>
              </ul>
              <div className="mt-2 flex gap-2">
                <Link to={`/box/${b.serial}`} className="btn btn-sm btn-primary">
                  Details
                </Link>
                {role === "admin" && (
                  <Link to={`/boxmanage?id=${b.id}`} className="btn btn-sm">
                    Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && !err && (
        <p className="opacity-60 text-center">Keine Kisten gefunden 🤷‍♂️</p>
      )}
    </div>
  );
}
