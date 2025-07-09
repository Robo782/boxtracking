// client/src/pages/BoxesManage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

/* ────────────────────────────────────────────── */
/* Hilfs-Funktionen zum Status-Mapping            */
const toFields = (v) => ({
  verfügbar: { departed: 0, returned: 0, is_checked: 0 },
  unterwegs : { departed: 1, returned: 0, is_checked: 0 },
  zurück    : { departed: 1, returned: 1, is_checked: 0 },
  geprüft   : { departed: 1, returned: 1, is_checked: 1 }
}[v]);

const current = (b) => !b.departed ? "verfügbar"
  : b.departed && !b.returned ? "unterwegs"
  : b.returned && !b.is_checked ? "zurück"
  : "geprüft";
/* ────────────────────────────────────────────── */

export default function BoxesManage() {
  const role = localStorage.getItem("role");
  const nav  = useNavigate();
  const cfg  = { headers: { Authorization:`Bearer ${localStorage.getItem("token")}` } };

  const [boxes, setBoxes] = useState([]);
  const [err,   setErr  ] = useState("");

  /* Boxen laden + Zugriffsschutz */
  useEffect(() => {
    if (role !== "admin") { nav("/boxes"); return; }

    (async () => {
      try {
        const { data } = await axios.get("/api/boxes", cfg);
        setBoxes(data);
      } catch {
        setErr("⚠️ Boxen konnten nicht geladen werden");
      }
    })();
  }, [role, nav]);

  /* Patch-Aufruf */
  const save = async (id, payload) => {
    try {
      await axios.patch(`/api/admin/boxes/${id}`, payload, cfg);
      setBoxes(prev => prev.map(b => (b.id === id ? { ...b, ...payload } : b)));
    } catch { setErr("⚠️ Fehler beim Speichern"); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🛠 Box-Verwaltung</h1>
        <Link
          to="/boxes"
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          ↩ Zur Übersicht
        </Link>
      </div>

      {err && <p className="text-red-600 mb-4">{err}</p>}

      {/* Grid mit Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boxes.map(b => (
          <BoxCard
            key={b.id}
            box={b}
            current={current(b)}
            onSave={save}
          />
        ))}
        {boxes.length === 0 && (
          <p className="col-span-full text-center text-gray-600">
            Keine Boxen vorhanden
          </p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/* Einzel-Karte mit Edit-Funktion                */
function BoxCard({ box, current, onSave }) {
  const [f, setF] = useState({
    serial       : box.serial,
    cycles       : box.cycles,
    device_serial: box.device_serial ?? "",
    status       : current,
    checked_by   : box.checked_by ?? ""
  });
  const change = (k,v) => setF({ ...f, [k]: v });

  const patch = () => {
    onSave(box.id, {
      serial       : f.serial,
      cycles       : +f.cycles,
      device_serial: f.device_serial,
      checked_by   : f.checked_by,
      ...toFields(f.status)
    });
  };

  return (
    <div className="border rounded shadow-sm p-4 space-y-4 bg-white">
      {/* Kopfbereich */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{f.serial}</h2>
        <button
          onClick={patch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          title="Speichern"
        >
          💾
        </button>
      </div>

      {/* Felder */}
      <div className="space-y-3">
        {/* Serial + Cycles */}
        <div className="flex gap-2">
          <input
            value={f.serial}
            onChange={e=>change("serial", e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          />
          <input
            value={f.cycles}
            onChange={e=>change("cycles", e.target.value)}
            className="w-20 border rounded px-2 py-1 text-center"
            type="number"
          />
        </div>

        {/* Device-Serial */}
        <input
          value={f.device_serial}
          onChange={e=>change("device_serial", e.target.value)}
          className="w-full border rounded px-2 py-1"
          placeholder="Device-Serial"
        />

        {/* Status + Prüfer */}
        <div className="flex gap-2">
          <select
            value={f.status}
            onChange={e=>change("status", e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          >
            <option>verfügbar</option>
            <option>unterwegs</option>
            <option>zurück</option>
            <option>geprüft</option>
          </select>

          <input
            value={f.checked_by}
            onChange={e=>change("checked_by", e.target.value)}
            className="w-32 border rounded px-2 py-1"
            placeholder="Prüfer"
          />
        </div>
      </div>
    </div>
  );
}
