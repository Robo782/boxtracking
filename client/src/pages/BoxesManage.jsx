// client/src/pages/BoxesManage.jsx
import { useEffect, useState, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";

const token = localStorage.getItem("token");

export default function BoxesManage() {
  const [boxes, setBoxes]          = useState([]);
  const [sel,   setSel]            = useState(new Set());
  const [statF, setStatF]          = useState("all");
  const [typeF, setTypeF]          = useState("all");

  /* ---------- Daten laden ---------- */
  const load = () =>
    fetch("/api/boxes", {
      headers:{ Authorization:`Bearer ${token}` }
    }).then(r=>r.json()).then(setBoxes);

  useEffect(load, []);

  /* ---------- Filter ---------- */
  const list = useMemo(() =>
    boxes.filter(b =>
      (statF==="all" || b.status===statF) &&
      (typeF==="all" || b.type  ===typeF)
    ), [boxes, statF, typeF]);

  /* ---------- Auswahl ---------- */
  const toggle = id => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };
  const allSel = list.every(b=>sel.has(b.id));

  /* ---------- Aktion ---------- */
  async function bulk(action) {
    if (sel.size===0) return alert("Nichts ausgewählt");
    const ids = Array.from(sel);
    await fetch("/api/admin/boxes/bulk", {
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify({ ids, action })
    });
    setSel(new Set());
    load();
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-4 max-w-5xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Box-Pflege</h1>

      {/* Filterzeile */}
      <div className="flex gap-2 items-center flex-wrap">
        <select className="select select-bordered select-sm"
                value={statF} onChange={e=>setStatF(e.target.value)}>
          <option value="all">Status: Alle</option>
          <option>Verfügbar</option><option>Unterwegs</option>
          <option>Rücklauf</option><option>Geprüft</option>
        </select>

        <select className="select select-bordered select-sm"
                value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="all">Typ: Alle</option>
          <option>PU-S</option><option>PU-M</option>
          <option>PR-M</option>
        </select>

        <span className="ml-auto text-sm opacity-60">
          {sel.size} ausgewählt
        </span>
      </div>

      {/* Aktionen */}
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-sm"
                onClick={()=>bulk("load")}>Auslagern</button>
        <button className="btn btn-sm btn-accent"
                onClick={()=>bulk("return")}>Zurücknehmen</button>
        <button className="btn btn-sm btn-info"
                onClick={()=>bulk("check")}>Prüfen</button>
        <button className="btn btn-sm btn-outline btn-error"
                onClick={()=>bulk("reset")}>Status zurücksetzen</button>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <input type="checkbox"
                       checked={allSel}
                       onChange={()=>setSel(allSel ? new Set() : new Set(list.map(b=>b.id)))} />
              </th>
              <th>Serial</th><th>Typ</th><th>Status</th>
              <th>Cycles</th><th>Device</th>
            </tr>
          </thead>
          <tbody>
            {list.map(b=>(
              <tr key={b.id}>
                <td>
                  <input type="checkbox"
                         checked={sel.has(b.id)}
                         onChange={()=>toggle(b.id)} />
                </td>
                <td>{b.serial}</td>
                <td>{b.type}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>{b.cycles}</td>
                <td>{b.deviceSerial||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
