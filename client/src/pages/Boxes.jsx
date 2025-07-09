// client/src/pages/Boxes.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

/* ───────── Hilfsfunktionen ───────────────────────── */
const statusLabel = (b) =>
  !b.departed
    ? { txt: "Verfügbar",       icon: "📍",  clr: "text-green-700" }
    : b.returned
      ? b.is_checked
        ? { txt: "Geprüft",      icon: "✅",  clr: "text-emerald-700" }
        : { txt: "Rücklauf offen",icon: "🕐", clr: "text-yellow-700" }
      : { txt: "Unterwegs",      icon: "📦",  clr: "text-orange-700" };

const actionLabel = (b) =>
  !b.departed
    ? "Kiste auslagern"
    : b.departed && !b.returned
      ? "Kiste zurücknehmen"
      : b.returned && !b.is_checked
        ? "Überprüfung"
        : "Kiste auslagern";
/* ─────────────────────────────────────────────────── */

export default function Boxes() {
  /* ── State ───────────────────────────────────────── */
  const [boxes,  setBoxes]  = useState([]);
  const [query,  setQuery]  = useState("");
  const [result, setResult] = useState([]);

  /* Filter-State */
  const [statusFilter, setStatusFilter] = useState("");
  const [prefixFilter, setPrefixFilter] = useState("");

  /* Auth-Header */
  const role = localStorage.getItem("role");
  const hdr  = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* ── Boxen laden (inkl. Filter) ─────────────────── */
  const fetchBoxes = () =>
    axios
      .get("/api/boxes", {
        headers: hdr,
        params : { status: statusFilter, prefix: prefixFilter },
      })
      .then((r) => setBoxes(r.data))
      .catch(console.error);

  useEffect(() => { fetchBoxes(); }, [statusFilter, prefixFilter]);

  /* ── Suche ──────────────────────────────────────── */
  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return setResult([]);
    try {
      const r = await axios.get("/api/boxes/search", { params: { q }, headers: hdr });
      setResult(r.data);
    } catch (err) {
      alert(err.response?.data?.error || "Suche fehlgeschlagen");
    }
  };

  /* ── DB-Reset (Admin) ───────────────────────────── */
  const resetDb = async () => {
    if (!window.confirm("Datenbank wirklich zurücksetzen?")) return;
    await axios.post("/api/admin/reset", null, { headers: hdr });
    alert("Box-Werte wurden zurückgesetzt");
    fetchBoxes();
  };

  /* ── UI ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Kopfzeile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">📦 Übersicht</h1>

          {role === "admin" && (
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/boxes-manage"
                    className="btn-gray">Box-Verwaltung</Link>
              <Link to="/admin"
                    className="btn-gray">Admin-Bereich</Link>
              <button onClick={resetDb}
                      className="btn-red">DB Reset</button>
            </div>
          )}
        </div>

        {/* Filterleisten */}
        <div className="flex flex-wrap gap-4">
          <select value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select">
            <option value="">Alle Status</option>
            <option value="available">Verfügbar</option>
            <option value="departed">Unterwegs</option>
            <option value="returned">Zurück (offen)</option>
            <option value="checked">Geprüft</option>
          </select>

          <select value={prefixFilter}
                  onChange={(e) => setPrefixFilter(e.target.value)}
                  className="select">
            <option value="">Alle Typen</option>
            <option value="PU-M">PU-M-xx</option>
            <option value="PU-S">PU-S-xx</option>
            <option value="PR-M">PR-M-xx</option>
            <option value="PR-SB">PR-SB-xx</option>
          </select>
        </div>

        {/* Suchleiste */}
        <form onSubmit={runSearch} className="flex flex-wrap gap-2">
          <input
            placeholder="PCC-ID oder Device-Serial"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-[220px] input"
          />
          <button type="submit" className="btn-blue">Search</button>
          {result.length > 0 && (
            <button type="button"
                    onClick={() => setResult([])}
                    className="btn-gray">
              Clear
            </button>
          )}
        </form>

        {/* Suchergebnis (als Karten) */}
        {result.length > 0 && (
          <>
            <h3 className="text-lg font-medium">Suchergebnis</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.map((r, i) => (
                <div key={i} className="card">
                  <p className="font-medium">{r.box_serial}</p>
                  <p className="text-sm text-gray-600">Device: {r.device_serial}</p>
                  <p className="text-sm text-gray-600">Prüfer: {r.checked_by || "-"}</p>
                  <p className="text-sm text-gray-600">PCC: {r.pcc_id}</p>
                </div>
              ))}
            </div>
            <hr />
          </>
        )}

        {/* Gesamtliste als Karten-Grid */}
        {boxes.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">
            Keine Boxen gefunden
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boxes.map((b) => {
              const st = statusLabel(b);
              return (
                <div key={b.id} className="card relative">
                  {/* Status-Badge */}
                  <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-white shadow ${st.clr}`}>
                    {st.icon}
                  </span>

                  <p className="text-lg font-semibold mb-2">{b.serial}</p>

                  <ul className="text-sm text-gray-600 space-y-0.5">
                    <li>Status: <span className={st.clr}>{st.txt}</span></li>
                    <li>Cycles: {b.cycles}</li>
                    <li>Device: {b.device_serial || "-"}</li>
                  </ul>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/box/${b.id}`}
                      className="btn-blue flex-1 text-xs">
                      {actionLabel(b)}
                    </Link>
                    <Link
                      to={`/box/${b.id}/history`}
                      className="btn-gray text-xs">
                      History
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
