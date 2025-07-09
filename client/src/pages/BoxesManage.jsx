// client/src/pages/BoxesManage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

/* Status-Mapping */
const toFields = (v) =>
  ({
    verfügbar: { departed: 0, returned: 0, is_checked: 0 },
    unterwegs : { departed: 1, returned: 0, is_checked: 0 },
    zurück    : { departed: 1, returned: 1, is_checked: 0 },
    geprüft   : { departed: 1, returned: 1, is_checked: 1 },
  }[v]);

const current = (b) =>
  !b.departed
    ? "verfügbar"
    : b.departed && !b.returned
      ? "unterwegs"
      : b.returned && !b.is_checked
        ? "zurück"
        : "geprüft";

export default function BoxesManage() {
  const role = localStorage.getItem("role");
  const nav  = useNavigate();

  const cfg = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const [boxes, setBoxes] = useState([]);
  const [err,   setErr]   = useState("");

  /* Laden + Guard */
  useEffect(() => {
    if (role !== "admin") {
      nav("/boxes");
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get("/api/boxes", cfg);
        setBoxes(data);
      } catch {
        setErr("⚠️ Boxen konnten nicht geladen werden");
      }
    })();
  }, [role, nav]);

  /* Patch */
  const save = async (id, payload) => {
    try {
      await axios.patch(`/api/admin/boxes/${id}`, payload, cfg);
      setBoxes((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...payload } : b))
      );
    } catch {
      setErr("⚠️ Fehler beim Speichern");
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛠 Box-Verwaltung</h1>
        <Link to="/admin" className="btn btn-sm">↩ Dashboard</Link>
      </header>

      {err && <div className="alert alert-error">{err}</div>}

      {boxes.length === 0 ? (
        <div className="alert alert-info">Keine Boxen vorhanden.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boxes.map((b) => (
            <BoxCard
              key={b.id}
              box={b}
              current={current(b)}
              onSave={save}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Card-Komponente ---------- */
function BoxCard({ box, current, onSave }) {
  const [f, setF] = useState({
    serial:        box.serial,
    cycles:        box.cycles,
    device_serial: box.device_serial ?? "",
    status:        current,
    checked_by:    box.checked_by  ?? "",
  });

  const change = (k, v) => setF({ ...f, [k]: v });

  const patch = () => {
    onSave(box.id, {
      serial:        f.serial,
      cycles:        +f.cycles,
      device_serial: f.device_serial,
      checked_by:    f.checked_by,
      ...toFields(f.status),
    });
  };

  return (
    <article className="card bg-base-100 shadow">
      <div className="card-body space-y-3">
        <h2 className="card-title text-sm">{f.serial}</h2>

        <div className="flex gap-2">
          <input
            value={f.serial}
            onChange={(e) => change("serial", e.target.value)}
            className="input input-bordered flex-1"
          />
          <input
            type="number"
            value={f.cycles}
            onChange={(e) => change("cycles", e.target.value)}
            className="input input-bordered w-24 text-center"
          />
        </div>

        <input
          value={f.device_serial}
          onChange={(e) => change("device_serial", e.target.value)}
          placeholder="Device-Serial"
          className="input input-bordered w-full"
        />

        <div className="flex gap-2">
          <select
            value={f.status}
            onChange={(e) => change("status", e.target.value)}
            className="select select-bordered flex-1"
          >
            <option value="verfügbar">verfügbar</option>
            <option value="unterwegs">unterwegs</option>
            <option value="zurück">zurück</option>
            <option value="geprüft">geprüft</option>
          </select>
          <input
            value={f.checked_by}
            onChange={(e) => change("checked_by", e.target.value)}
            placeholder="Prüfer"
            className="input input-bordered w-32"
          />
        </div>

        <div className="card-actions justify-end">
          <button onClick={patch} className="btn btn-sm btn-primary">
            💾 Speichern
          </button>
        </div>
      </div>
    </article>
  );
}
