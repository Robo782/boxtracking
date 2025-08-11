// client/src/pages/boxdbadmin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";

const STATUSES = ["available", "departed", "returned", "maintenance", "damaged"];

export default function BoxDbAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const debounce = useRef(null);

  const fetchList = (term = "") => {
    setLoading(true);
    setError("");
    const url = term.trim().length ? `/boxes/admin?search=${encodeURIComponent(term.trim())}` : "/boxes/admin";
    api.get(url)
      .then(setRows)
      .catch(e => setError(e?.message || "Konnte Boxen nicht laden"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchList(q), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q]);

  const onPatch = async (id, patch) => {
    const updated = await api.patch(`/boxes/admin/${id}`, patch);
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
  };
  const onDelete = async (id) => {
    await api.del(`/boxes/admin/${id}`);
    setRows(prev => prev.filter(r => r.id !== id));
  };
  const onCreate = async (payload) => {
    const created = await api.post(`/boxes/admin`, payload);
    setRows(prev => [created, ...prev]);
  };

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <header className="mb-4 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Admin · Box‑Editor</h1>
        <button className="btn btn-sm btn-primary" onClick={() => setCreating(true)}>Neue Box</button>
        <div className="grow" />
        <input
          className="input input-bordered w-72"
          placeholder="Suchen … (Serial, PCC, Device – inkl. Historie)"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </header>

      {error && <p className="text-error mb-3">{error}</p>}
      {loading && <p>lädt …</p>}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Serial</th>
                <th>Status</th>
                <th>Zyklen</th>
                <th>Maint</th>
                <th>Device SN</th>
                <th>PCC-ID</th>
                <th>Prüfer</th>
                <th>Damaged at</th>
                <th>Reason</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <Row key={r.id} row={r} onPatch={onPatch} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <CreateDialog onClose={() => setCreating(false)} onCreate={onCreate} />}
    </section>
  );
}

function Row({ row, onPatch, onDelete }) {
  const [form, setForm] = useState(row);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(row), [row]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(row), [form, row]);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    const patch = diff(row, form);
    if (!Object.keys(patch).length) return;
    setBusy(true);
    try { await onPatch(row.id, patch); } finally { setBusy(false); }
  };
  const reset = () => setForm(row);
  const del = async () => {
    if (!confirm(`Box #${row.id} (${row.serial}) wirklich löschen?`)) return;
    setBusy(true);
    try { await onDelete(row.id); } finally { setBusy(false); }
  };

  return (
    <tr className={dirty ? "bg-warning/10" : ""}>
      <td className="whitespace-nowrap">{row.id}</td>
      <td><input className="input input-xs input-bordered w-40" value={form.serial ?? ""} onChange={e => set("serial", e.target.value)} /></td>
      <td>
        <select className="select select-xs select-bordered w-40" value={form.status ?? ""} onChange={e => set("status", e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td><input type="number" className="input input-xs input-bordered w-20" value={form.cycles ?? 0} onChange={e => set("cycles", Number(e.target.value))} /></td>
      <td><input type="number" className="input input-xs input-bordered w-20" value={form.maintenance_count ?? 0} onChange={e => set("maintenance_count", Number(e.target.value))} /></td>
      <td><input className="input input-xs input-bordered w-40" value={form.device_serial ?? ""} onChange={e => set("device_serial", e.target.value)} /></td>
      <td><input className="input input-xs input-bordered w-40" value={form.pcc_id ?? ""} onChange={e => set("pcc_id", e.target.value)} /></td>
      <td><input className="input input-xs input-bordered w-36" value={form.checked_by ?? ""} onChange={e => set("checked_by", e.target.value)} /></td>
      <td><input type="datetime-local" className="input input-xs input-bordered w-56" value={toLocal(form.damaged_at)} onChange={e => set("damaged_at", fromLocal(e.target.value))} /></td>
      <td><input className="input input-xs input-bordered w-64" value={form.damage_reason ?? ""} onChange={e => set("damage_reason", e.target.value)} /></td>
      <td className="text-right whitespace-nowrap">
        <div className="flex gap-2 justify-end">
          <button className="btn btn-xs" disabled={!dirty || busy} onClick={reset}>Reset</button>
          <button className={`btn btn-xs ${dirty ? "btn-primary" : ""}`} disabled={!dirty || busy} onClick={save}>Speichern</button>
          <button className="btn btn-xs btn-error" disabled={busy} onClick={del}>Löschen</button>
        </div>
      </td>
    </tr>
  );
}

function CreateDialog({ onClose, onCreate }) {
  const [form, setForm] = useState({
    serial: "", status: "available", cycles: 0, maintenance_count: 0,
    device_serial: "", pcc_id: "", checked_by: "", damaged_at: null, damage_reason: ""
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.serial.trim()) { alert("Serial fehlt"); return; }
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.damaged_at) delete payload.damaged_at;
      await onCreate(payload);
      onClose();
    } catch (e) { alert(e?.message || "Erstellen fehlgeschlagen"); }
    finally { setBusy(false); }
  };

  return (
    <dialog open className="modal">
      <div className="modal-box max-w-3xl">
        <h3 className="font-semibold text-lg mb-3">Neue Box anlegen</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="form-control"><span className="label-text">Serial *</span>
            <input className="input input-bordered" value={form.serial} onChange={e => set("serial", e.target.value)} />
          </label>
          <label className="form-control"><span className="label-text">Status</span>
            <select className="select select-bordered" value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="form-control"><span className="label-text">Zyklen</span>
            <input type="number" className="input input-bordered" value={form.cycles} onChange={e => set("cycles", Number(e.target.value))} />
          </label>
          <label className="form-control"><span className="label-text">Maint</span>
            <input type="number" className="input input-bordered" value={form.maintenance_count} onChange={e => set("maintenance_count", Number(e.target.value))} />
          </label>
          <label className="form-control"><span className="label-text">Device SN</span>
            <input className="input input-bordered" value={form.device_serial} onChange={e => set("device_serial", e.target.value)} />
          </label>
          <label className="form-control"><span className="label-text">PCC-ID</span>
            <input className="input input-bordered" value={form.pcc_id} onChange={e => set("pcc_id", e.target.value)} />
          </label>
          <label className="form-control"><span className="label-text">Prüfer</span>
            <input className="input input-bordered" value={form.checked_by} onChange={e => set("checked_by", e.target.value)} />
          </label>
          <label className="form-control"><span className="label-text">Damaged at</span>
            <input type="datetime-local" className="input input-bordered" value={toLocal(form.damaged_at)} onChange={e => set("damaged_at", fromLocal(e.target.value))} />
          </label>
          <label className="form-control sm:col-span-2"><span className="label-text">Schadensgrund</span>
            <input className="input input-bordered" value={form.damage_reason} onChange={e => set("damage_reason", e.target.value)} />
          </label>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose} disabled={busy}>Abbrechen</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>Anlegen</button>
        </div>
      </div>
    </dialog>
  );
}

function diff(a, b) {
  const out = {};
  Object.keys(b).forEach(k => { if (b[k] !== a[k]) out[k] = b[k]; });
  return out;
}
function toLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(+d) ? null : d.toISOString();
}
