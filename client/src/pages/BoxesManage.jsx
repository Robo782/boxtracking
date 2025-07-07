// client/src/pages/BoxesManage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function BoxesManage() {
  /* ────────── Zugriff & Header ────────── */
  const role = localStorage.getItem("role");
  const nav  = useNavigate();
  const cfg  = { headers: { Authorization:`Bearer ${localStorage.getItem("token")}` } };

  /* ────────── State ────────── */
  const [boxes, setBoxes] = useState([]);
  const [err,   setErr  ] = useState("");

  /* ────────── Laden ────────── */
  useEffect(() => {
    /* 1. Nicht-Admin? → zurück zur Übersicht */
    if (role !== "admin") {
      nav("/boxes");
      return;
    }

    /* 2. Boxen vom Server holen (kein async direkt im useEffect) */
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/boxes", cfg);
        setBoxes(data);
      } catch (e) {
        setErr("⚠️ Boxen konnten nicht geladen werden");
      }
    };
    fetchData();
  }, [role, nav]);           // runs exactly once when component mounts

  /* ────────── Mapping Dropdown ↔ Felder ────────── */
  const toFields = (v) => ({
    verfügbar: { departed:0, returned:0, is_checked:0 },
    unterwegs : { departed:1, returned:0, is_checked:0 },
    zurück    : { departed:1, returned:1, is_checked:0 },
    geprüft   : { departed:1, returned:1, is_checked:1 }
  }[v]);

  const current = (b) => !b.departed ? "verfügbar"
                     : b.departed && !b.returned ? "unterwegs"
                     : b.returned && !b.is_checked ? "zurück"
                     : "geprüft";

  /* ────────── Speichern ────────── */
  const save = async (id, patch) => {
    try {
      await axios.patch(`/api/admin/boxes/${id}`, patch, cfg);
      setBoxes(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
    } catch {
      setErr("⚠️ Fehler beim Speichern");
    }
  };

  return (
    <div style={{ padding:20 }}>
      {/* Kopfzeile */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1>🛠 Box-Verwaltung</h1>
        <Link to="/boxes"><button>⇦ Zur Übersicht</button></Link>
      </div>

      {err && <p style={{ color:"red" }}>{err}</p>}

      <table border="1" cellPadding="6" style={{ width:"100%", borderCollapse:"collapse", marginTop:20 }}>
        <thead style={{ background:"#f0f0f0" }}>
          <tr>
            <th>Serial</th><th>Cycles</th><th>Device</th>
            <th>Status</th><th>Prüfer</th><th>💾</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map(b=>(
            <Row
              key={b.id}
              box={b}
              current={current(b)}
              toFields={toFields}
              onSave={save}
            />
          ))}
          {boxes.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign:"center" }}>Keine Boxen vorhanden</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ────────── Zeilen-Komponente ────────── */
function Row({ box, current, toFields, onSave }) {
  const [f, setF] = useState({
    serial       : box.serial,
    cycles       : box.cycles,
    device_serial: box.device_serial ?? "",
    status       : current,
    checked_by   : box.checked_by ?? ""
  });

  const h = (k,v) => setF({ ...f, [k]:v });

  const patch = () => {
    const payload = {
      serial       : f.serial,
      cycles       : +f.cycles,
      device_serial: f.device_serial,
      checked_by   : f.checked_by,
      ...toFields(f.status)
    };
    onSave(box.id, payload);
  };

  return (
    <tr>
      <td><input value={f.serial}        onChange={e=>h("serial", e.target.value)} /></td>
      <td><input value={f.cycles}        onChange={e=>h("cycles", e.target.value)} style={{ width:60 }} /></td>
      <td><input value={f.device_serial} onChange={e=>h("device_serial", e.target.value)} /></td>
      <td>
        <select value={f.status} onChange={e=>h("status", e.target.value)}>
          <option>verfügbar</option>
          <option>unterwegs</option>
          <option>zurück</option>
          <option>geprüft</option>
        </select>
      </td>
      <td><input value={f.checked_by} onChange={e=>h("checked_by", e.target.value)} style={{ width:80 }} /></td>
      <td><button onClick={patch}>💾</button></td>
    </tr>
  );
}
