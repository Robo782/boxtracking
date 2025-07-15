/* client/src/pages/boxes.jsx */
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import FilterBar from "../components/FilterBar";

/* Token & Rolle aus localStorage */
const token = localStorage.getItem("token");
const role  = localStorage.getItem("role");   // 'admin' | 'user' | null

export default function Boxes() {
  const [boxes, setBoxes] = useState([]);
  const [query, setQuery] = useState("");
  const [stat , setStat ] = useState("all");
  const [type , setType ] = useState("all");
  const [error, setError] = useState("");

  /* ---- Daten holen ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boxes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Kisten konnten nicht geladen werden");
        setBoxes(await res.json());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  /* ---- Filter --------------------------------------------------------- */
  const list = useMemo(() => {
    return boxes.filter(b => {
      const matchStatus = stat === "all" || b.status === stat;
      const matchType   = type === "all" || b.type   === type;
      const matchQuery  =
        query === "" ||
        b.serial.toLowerCase().includes(query) ||
        (b.deviceSerial ?? "").toLowerCase().includes(query);
      return matchStatus && matchType && matchQuery;
    });
  }, [boxes, stat, type, query]);

  /* ---- UI ------------------------------------------------------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Übersicht <span className="opacity-60">{list.length}/{boxes.length}</span>
      </h1>

      <FilterBar {...{ query, setQuery, stat, setStat, type, setType }} />

      {error && <p className="text-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(box => (
          <div key={box.id} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h2 className="card-title">
                {box.serial} &nbsp; <span className="opacity-60">{box.type}</span>
              </h2>

              <ul className="text-sm space-y-0.5">
                <li>Status:  {box.status}</li>
                <li>Cycles:  {box.cycles}</li>
                <li>Device:  {box.deviceSerial || "—"}</li>
              </ul>

              <div className="mt-2 flex gap-2">
                {/* 👉 Link korrigiert */}
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
