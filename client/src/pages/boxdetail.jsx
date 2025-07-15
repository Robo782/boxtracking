/* client/src/pages/boxdetail.jsx */
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function BoxDetail() {
  const { id } = useParams();       // serial
  const nav    = useNavigate();

  const [box,  setBox ] = useState(null);
  const [err,  setErr ] = useState("");

  /* --------- Laden --------------------------------------------------- */
  const load = () => {
    const token = localStorage.getItem("token");
    fetch(`/api/boxes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject("Kiste nicht gefunden")))
      .then(setBox)
      .catch(setErr);
  };

  useEffect(load, [id]);

  if (!box && !err)   return <p className="p-6">Lade …</p>;
  if (err)            return <p className="p-6 text-error">{err}</p>;

  /* --------- nächste Aktion bestimmen -------------------------------- */
  const action = !box.departed
    ? { label: "Auslagern", api: "load",    css: "primary" }
    : box.departed && !box.returned
    ? { label: "Zurücknehmen", api: "return", css: "accent" }
    : box.returned && !box.is_checked
    ? { label: "Prüfen",   api: "check",  css: "info" }
    : null;

  const doAction = async () => {
    if (!action) return;
    if (!confirm(`Kiste wirklich ${action.label.toLowerCase()}?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/boxes/${id}/${action.api}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  const role = localStorage.getItem("role");
  const delBox = async () => {
    if (!confirm("Kiste endgültig löschen?")) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/boxes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    nav("/boxes");
  };

  /* --------- UI ------------------------------------------------------ */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{box.serial}</h1>

      <table className="table w-auto">
        <tbody>
          <tr><td>Status</td><td>{box.status}</td></tr>
          <tr><td>Cycles</td><td>{box.cycles}</td></tr>
          <tr><td>Device</td><td>{box.deviceSerial || "—"}</td></tr>
          <tr><td>Departed</td><td>{String(box.departed)}</td></tr>
          <tr><td>Returned</td><td>{String(box.returned)}</td></tr>
          <tr><td>Checked</td><td>{box.is_checked ? "✅" : "—"}</td></tr>
        </tbody>
      </table>

      {action && (
        <button onClick={doAction} className={`btn btn-${action.css}`}>
          {action.label}
        </button>
      )}

      <Link to={`/box/${box.serial}/history`} className="btn">
        History
      </Link>

      {role === "admin" && (
        <button onClick={delBox} className="btn btn-error">
          Löschen
        </button>
      )}

      <Link to="/boxes" className="link block mt-4">← Zurück</Link>
    </div>
  );
}
