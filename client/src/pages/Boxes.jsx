// client/src/pages/Boxes.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

/* ────────── Hilfs-Maps ────────── */
const statusInfo = (b) => {
  if (!b.departed)                 return { txt: "Verfügbar", clr: "success" };
  if (b.departed && !b.returned)   return { txt: "Unterwegs", clr: "accent"  };
  if (b.returned && !b.is_checked) return { txt: "Rücklauf offen", clr: "warning" };
  return { txt: "Geprüft", clr: "info" };
};

/* UI-Label + Server-Enum */
const STATUS_OPTIONS = [
  { ui: "Alle Status",     q: "" },
  { ui: "Verfügbar",       q: "available" },
  { ui: "Unterwegs",       q: "departed" },
  { ui: "Rücklauf offen",  q: "returned" },
  { ui: "Geprüft",         q: "checked" },
];

const PREFIX_OPTIONS = [
  { ui: "Alle Typen", q: ""     },
  { ui: "PU-M-xx",    q: "PU-M" },
  { ui: "PU-S-xx",    q: "PU-S" },
  { ui: "PR-M-xx",    q: "PR-M" },
  { ui: "PR-SB-xx",   q: "PR-SB"},
];

export default function Boxes() {
  const [boxes,  setBoxes ]  = useState([]);
  const [query,  setQuery ]  = useState("");
  const [result, setResult]  = useState([]);
  const [status, setStatus]  = useState("");
  const [prefix, setPrefix]  = useState("");

  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };
  const role = localStorage.getItem("role");

  /* ------------ Daten holen ------------- */
  const fetchBoxes = () =>
    axios
      .get("/api/boxes", {
        headers: hdr,
        params : { status, prefix },
      })
      .then((r) => setBoxes(r.data))
      .catch(console.error);

  useEffect(fetchBoxes, [status, prefix]);

  /* ------------ Suche ------------ */
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

  /* ------------ UI ------------ */
  const shown = result.length ? result : boxes;

  return (
    <div className="p-4 flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📦 Übersicht
        </h1>
        {role === "admin" && (
          <button
            onClick={() =>
              window.confirm("Datenbank wirklich zurücksetzen?") &&
              axios.post("/api/admin/reset", null, { headers: hdr }).then(fetchBoxes)
            }
            className="btn btn-xs btn-error"
          >
            DB&nbsp;Reset
          </button>
        )}
      </div>

      {/* Filterleiste */}
      <form
        onSubmit={runSearch}
        className="flex flex-wrap items-center gap-2"
      >
        <select
          className="select select-bordered"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.q} value={o.q}>
              {o.ui}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        >
          {PREFIX_OPTIONS.map((o) => (
            <option key={o.q} value={o.q}>
              {o.ui}
            </option>
          ))}
        </select>

        <input
          className="input input-bordered flex-1 min-w-[200px]"
          placeholder="PCC-ID / Device-Serial"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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

      {/* Box-Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((b) => {
          const st = statusInfo(b);
          const action = !b.departed
            ? { label: "Kiste auslagern", api: "load" }
            : b.departed && !b.returned
            ? { label: "Kiste zurücknehmen", api: "return" }
            : b.returned && !b.is_checked
            ? { label: "Überprüfung", api: "check" }
            : { label: "Kiste auslagern", api: "load" };

          const doAction = () =>
            axios
              .put(`/api/boxes/${b.id}/${action.api}`, null, { headers: hdr })
              .then(fetchBoxes);

          return (
            <div
              key={b.id}
              className="card bg-base-100 shadow-md border border-base-200"
            >
              <div className="card-body p-4">
                <h2 className="card-title">{b.serial}</h2>
                <ul className="text-sm leading-6">
                  <li>
                    <span className={`badge badge-${st.clr}`}>{st.txt}</span>
                  </li>
                  <li>Cycles: {b.cycles}</li>
                  <li>Device: {b.device_serial || "—"}</li>
                </ul>

                <div className="mt-4 flex gap-2">
                  <button onClick={doAction} className="btn btn-sm btn-primary">
                    {action.label}
                  </button>
                  <Link
                    className="btn btn-sm btn-outline"
                    to={`/boxes/${b.id}/history`}
                  >
                    History
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
