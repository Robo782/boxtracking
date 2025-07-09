// client/src/pages/Boxes.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

/* ────────── Helper ────────── */
const statusInfo = (b) =>
  !b.departed
    ? { txt: "Verfügbar",   clr: "success" }
    : b.returned
      ? b.is_checked
        ? { txt: "Geprüft",  clr: "info" }
        : { txt: "Rücklauf", clr: "warning" }
      : { txt: "Unterwegs",  clr: "accent" };

const actionLabel = (b) =>
  !b.departed
    ? "Kiste auslagern"
    : b.departed && !b.returned
      ? "Kiste zurücknehmen"
      : b.returned && !b.is_checked
        ? "Überprüfung"
        : "Kiste auslagern";

/* ─────────────────────────── */
export default function Boxes() {
  const [boxes,  setBoxes]  = useState([]);
  const [query,  setQuery]  = useState("");
  const [result, setResult] = useState([]);

  /* Filter-State */
  const [statusFilter,  setStatusFilter]  = useState("");
  const [prefixFilter,  setPrefixFilter]  = useState("");

  /* Auth-Header */
  const role = localStorage.getItem("role");
  const hdr  = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* -------- Boxen holen -------- */
  const fetchBoxes = () =>
    axios
      .get("/api/boxes", {
        headers: hdr,
        params : { status: statusFilter, prefix: prefixFilter },
      })
      .then((r) => setBoxes(r.data))
      .catch(console.error);

  useEffect(() => {
    fetchBoxes();
  }, [statusFilter, prefixFilter]);

  /* ---------- Suche ---------- */
  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return setResult([]);
    try {
      const { data } = await axios.get("/api/boxes/search", {
        params: { q },
        headers: hdr,
      });
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || "Suche fehlgeschlagen");
    }
  };

  /* ---------- DB-Reset (Admin) ---------- */
  const resetDb = async () => {
    if (!window.confirm("Datenbank wirklich zurücksetzen?")) return;
    await axios.post("/api/admin/reset", null, { headers: hdr });
    fetchBoxes();
  };

  /* ---------------- UI ---------------- */
  const list = result.length ? result : boxes;

  return (
    <section className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Kopf */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📦 Übersicht
        </h1>
        {role === "admin" && (
          <button onClick={resetDb} className="btn btn-sm btn-error">
            DB Reset
          </button>
        )}
      </header>

      {/* Filter + Suche */}
      <form
        onSubmit={runSearch}
        className="flex flex-wrap gap-2 items-end bg-base-100 p-3 rounded shadow"
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered"
        >
          <option value="">Alle Status</option>
          <option value="verfügbar">Verfügbar</option>
          <option value="unterwegs">Unterwegs</option>
          <option value="zurück">Rücklauf offen</option>
          <option value="geprüft">Geprüft</option>
        </select>

        <select
          value={prefixFilter}
          onChange={(e) => setPrefixFilter(e.target.value)}
          className="select select-bordered"
        >
          <option value="">Alle Typen</option>
          <option value="PU-M">PU-M-xx</option>
          <option value="PU-S">PU-S-xx</option>
          <option value="PR-M">PR-M-xx</option>
          <option value="PR-SB">PR-SB-xx</option>
        </select>

        <input
          type="text"
          placeholder="PCC-ID / Device-Serial"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input input-bordered flex-1 min-w-[200px]"
        />
        <button className="btn btn-primary">Search</button>
        {result.length > 0 && (
          <button
            type="button"
            onClick={() => setResult([])}
            className="btn btn-ghost"
          >
            Clear
          </button>
        )}
      </form>

      {/* Grid mit Karten */}
      {list.length === 0 ? (
        <div className="alert alert-info mt-4">Keine Boxen gefunden.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((b) => {
            const st = statusInfo(b);
            return (
              <article
                key={b.id}
                className="card bg-base-100 border border-base-300 shadow"
              >
                <div className="card-body p-4">
                  <h2 className="card-title text-sm">{b.serial}</h2>

                  <ul className="text-xs leading-6">
                    <li>
                      <span className="font-medium">Status:</span>{" "}
                      <span className={`badge badge-${st.clr} badge-sm`}>
                        {st.txt}
                      </span>
                    </li>
                    <li>
                      <span className="font-medium">Cycles:</span> {b.cycles}
                    </li>
                    <li>
                      <span className="font-medium">Device:</span>{" "}
                      {b.device_serial || "—"}
                    </li>
                  </ul>

                  <div className="card-actions justify-end mt-2">
                    <Link
                      to={`/boxes/${b.id}`}
                      className="btn btn-xs btn-outline btn-info"
                    >
                      {actionLabel(b)}
                    </Link>
                    <Link
                      to={`/boxes/${b.id}/history`}
                      className="btn btn-xs btn-link"
                    >
                      History
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
