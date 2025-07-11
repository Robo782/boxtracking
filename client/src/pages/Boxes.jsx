// client/src/pages/Boxes.jsx
import { useEffect, useState, useMemo } from "react";
import { Link }                         from "react-router-dom";
import FilterBar                        from "../components/FilterBar";

/* Helper – Token & Role aus localStorage holen */
const token = localStorage.getItem("token");
const role  = localStorage.getItem("role");          // 'admin' | 'user' | null

export default function Boxes() {
  const [boxes,  setBoxes]   = useState([]);
  const [query,  setQuery]   = useState("");         // Textsuche
  const [stat,   setStat]    = useState("all");      // Status-Filter
  const [type,   setType]    = useState("all");      // Typ-Filter
  const [error,  setError]   = useState("");

  /* ---------- Daten holen ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boxes", {
          headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Kisten konnten nicht geladen werden");
        setBoxes(await res.json());
      } catch (err) { setError(err.message); }
    })();
  }, []);

  /* ---------- Filterlogik ---------- */
  const list = useMemo(() => {
    return boxes.filter(b => {
      const matchStatus = stat === "all"  || b.status === stat;
      const matchType   = type === "all"  || b.type   === type;
      const matchQuery  = query === "" ||
                          b.serial.toLowerCase().includes(query) ||
                          (b.deviceSerial ?? "").toLowerCase().includes(query);
      return matchStatus && matchType && matchQuery;
    });
  }, [boxes, stat, type, query]);

  /* ---------- Rendering ---------- */
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        📦 Übersicht
        <span className="text-sm font-normal badge badge-outline">
          {list.length}/{boxes.length}
        </span>
      </h1>

      <FilterBar
        status={stat} setStatus={setStat}
        type={type}   setType={setType}
        query={query} setQuery={setQuery}
      />

      {error && <p className="text-error my-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {list.map(box => (
          <div key={box.id} className="card bg-base-200 shadow">
            <div className="card-body p-4">
              <h3 className="card-title text-lg">
                {box.serial}{" "}
                <span className="badge badge-outline">{box.type}</span>
              </h3>

              <ul className="text-sm leading-6">
                <li>Status: <b>{box.status}</b></li>
                <li>Cycles: {box.cycles}</li>
                <li>Device: {box.deviceSerial || "—"}</li>
              </ul>

              <div className="card-actions justify-end mt-2">
                <Link to={`/boxes/${box.id}`} className="btn btn-sm btn-primary">
                  🔍 Details
                </Link>

                {role === "admin" && (
                  <Link
                    to={`/admin/boxes/${box.id}`}
                    className="btn btn-sm btn-secondary"
                  >
                    🛠 Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {list.length === 0 && !error && (
          <p className="col-span-full text-center opacity-60 mt-10">
            Keine Kisten gefunden 🤷‍♂️
          </p>
        )}
      </div>
    </div>
  );
}
