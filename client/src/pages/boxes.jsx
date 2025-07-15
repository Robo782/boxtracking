/* client/src/pages/boxes.jsx */
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import FilterBar from "../components/FilterBar";

export default function Boxes() {
  /* ------------------ State ------------------------------------------ */
  const [boxes,  setBoxes]  = useState([]);
  const [query,  setQuery]  = useState("");
  const [stat ,  setStat ]  = useState("all");
  const [type ,  setType ]  = useState("all");
  const [error,  setError]  = useState("");

  /* ------------------ Daten holen ------------------------------------ */
  useEffect(() => {
    const token = localStorage.getItem("token");          // ← hier, nicht oben!
    fetch("/api/boxes", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject("Kisten konnten nicht geladen werden")))
      .then(setBoxes)
      .catch(setError);
  }, []);

  /* ------------------ Filter ----------------------------------------- */
  const list = useMemo(() => {
    return boxes.filter(b => {
      const q = query.toLowerCase();
      const matchStatus = stat === "all" || b.status === stat;
      const matchType   = type === "all" || b.type   === type;
      const matchQuery  =
        q === "" ||
        b.serial.toLowerCase().includes(q) ||
        (b.deviceSerial ?? "").toLowerCase().includes(q);
      return matchStatus && matchType && matchQuery;
    });
  }, [boxes, stat, type, query]);

  /* ------------------ UI --------------------------------------------- */
  const role = localStorage.getItem("role");              // immer aktuell!

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Übersicht&nbsp;
        <span className="opacity-60">{list.length}/{boxes.length}</span>
      </h1>

      <FilterBar {...{ query, setQuery, stat, setStat, type, setType }} />

      {error && <p className="text-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(box => (
          <div key={box.id} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h2 className="card-title">
                {box.serial}
                <span className="opacity-60 text-sm">&nbsp;({box.type})</span>
              </h2>

              <ul className="text-sm leading-tight">
                <li>Status:  {box.status}</li>
                <li>Cycles:  {box.cycles}</li>
                <li>Device:  {box.deviceSerial || "—"}</li>
              </ul>

              <div className="mt-2 flex gap-2">
                {/* richtiger Link → /box/:serial */}
                <Link to={`/box/${box.serial}`} className="btn btn-sm btn-primary">
                  Details
                </Link>

                {role === "admin" && (
                  <Link
                    to={`/boxmanage?id=${box.id}`}
                    className="btn btn-sm"
                  >
                    Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && !error && (
        <p className="opacity-60 text-center">Keine Kisten gefunden 🤷‍♂️</p>
      )}
    </div>
  );
}
