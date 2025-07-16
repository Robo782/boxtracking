import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";

export default function BoxDetail() {
  const { id } = useParams();          // serial
  const nav    = useNavigate();

  const [box, setBox] = useState(null);
  const [err, setErr] = useState("");

  const load = () =>
    api(`/api/boxes/${id}`)
      .then(r => r.json())
      .then(setBox)
      .catch(() => setErr("Kiste nicht gefunden"));

  useEffect(load, [id]);

  if (!box && !err) return <p className="p-6">Lade …</p>;
  if (err)          return <p className="p-6 text-error">{err}</p>;

  const action = !box.departed
    ? { label:"Auslagern", api:"load",    css:"primary" }
    : box.departed && !box.returned
    ? { label:"Zurücknehmen", api:"return", css:"accent" }
    : box.returned && !box.is_checked
    ? { label:"Prüfen", api:"check",     css:"info" }
    : null;

  const doAction = async () => {
    if (!action) return;
    if (!confirm(`Kiste wirklich ${action.label.toLowerCase()}?`)) return;
    await api(`/api/boxes/${id}/${action.api}`, { method:"PUT" });
    load();
  };

  const role = localStorage.getItem("role");
  const delBox = async () => {
    if (!confirm("Kiste endgültig löschen?")) return;
    await api(`/api/boxes/${id}`, { method:"DELETE" });
    nav("/boxes");
  };

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

      <Link to={`/box/${box.serial}/history`} className="btn">History</Link>

      {role === "admin" && (
        <button onClick={delBox} className="btn btn-error">Löschen</button>
      )}
      <Link to="/boxes" className="link block mt-4">← Zurück</Link>
    </div>
  );
}
