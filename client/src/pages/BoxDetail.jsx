// client/src/pages/BoxDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const token = localStorage.getItem("token");
const role  = localStorage.getItem("role");

export default function BoxDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [box,   setBox]   = useState(null);
  const [error, setError] = useState("");

  const hdr = { Authorization:`Bearer ${token}` };

  /* ---------- Daten holen ---------- */
  const load = () =>
    fetch(`/api/boxes/${id}`, { headers: hdr })
      .then(r => r.ok ? r.json() : Promise.reject("404"))
      .then(setBox)
      .catch(() => setError("Kiste nicht gefunden"));

  useEffect(load, [id]);

  /* ---------- Aktion ermitteln ---------- */
  if (!box && !error) return <p className="p-4">Lade …</p>;
  if (error)          return <p className="p-4 text-error">{error}</p>;

  const action = !box.departed
    ? { label:"Auslagern",   api:"load",    next:"Unterwegs",   css:"primary"  }
    : box.departed && !box.returned
    ? { label:"Zurücknehmen",api:"return",  next:"Rücklauf",    css:"accent"   }
    : box.returned && !box.is_checked
    ? { label:"Prüfen",      api:"check",   next:"Geprüft",     css:"info"     }
    : null; // bereits geprüft

  const doAction = async () => {
    if (!action) return;
    const ok = confirm(`Kiste wirklich ${action.label.toLowerCase()}?`);
    if (!ok) return;
    await fetch(`/api/boxes/${id}/${action.api}`, { method:"PUT", headers:hdr });
    load();                       // reload Detail
  };

  const delBox = async () => {
    const ok = confirm("Kiste endgültig löschen – sicher?");
    if (!ok) return;
    await fetch(`/api/boxes/${id}`, { method:"DELETE", headers:hdr });
    nav("/boxes");
  };

  /* ---------- UI ---------- */
  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        📦 {box.serial}
        <span className="badge badge-outline">{box.type}</span>
      </h1>

      <table className="table border">
        <tbody>
          <tr><th>Status</th><td>{box.status}</td></tr>
          <tr><th>Cycles</th><td>{box.cycles}</td></tr>
          <tr><th>Device</th><td>{box.deviceSerial || "—"}</td></tr>
          <tr><th>Departed</th><td>{box.departed ?? "—"}</td></tr>
          <tr><th>Returned</th><td>{box.returned ?? "—"}</td></tr>
          <tr><th>Checked</th><td>{box.is_checked ? "✅" : "—"}</td></tr>
        </tbody>
      </table>

      <div className="flex gap-2">
        {action && (
          <button onClick={doAction} className={`btn btn-${action.css}`}>
            {action.label}
          </button>
        )}

        <Link to={`/boxes/${id}/history`} className="btn btn-outline">
          History
        </Link>

        {role==="admin" && (
          <button onClick={delBox} className="btn btn-error btn-outline ml-auto">
            Löschen
          </button>
        )}
      </div>

      <Link to="/boxes" className="link mt-4">← Zurück zur Übersicht</Link>
    </div>
  );
}
