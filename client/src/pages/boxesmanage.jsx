/* client/src/pages/boxesmanage.jsx */
import { useEffect, useState, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";

export default function BoxesManage() {
  const [boxes, setBoxes] = useState([]);
  const [sel  , setSel  ] = useState(new Set());
  const [statF, setStatF] = useState("all");
  const [typeF, setTypeF] = useState("all");

  /* ---- Daten holen ---- */
  const load = () => {
    const token = localStorage.getItem("token");
    fetch("/api/boxes", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json()).then(setBoxes);
  };
  useEffect(load, []);

  /* ---- Filter ---- */
  const list = useMemo(() => boxes.filter(b =>
    (statF==="all" || b.status===statF) &&
    (typeF==="all" || b.type  ===typeF)
  ), [boxes, statF, typeF]);

  /* ---- Auswahl ---- */
  const toggle = id => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };
  const allSel = list.every(b=>sel.has(b.id));

  /* ---- Bulk-Aktion ---- */
  async function bulk(action) {
    if (sel.size===0) return alert("Nichts ausgewählt");
    const token = localStorage.getItem("token");
    await fetch("/api/admin/boxes/bulk", {
      method :"PUT",
      headers:{ "Content-Type":"application/json",
                Authorization:`Bearer ${token}` },
      body   : JSON.stringify({ ids:Array.from(sel), action }),
    });
    setSel(new Set());
    load();
  }

  /* ---- UI ---- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Box-Pflege</h1>

      {/* Filterzeile */}
      <div className="flex flex-wrap gap-4 items-center">
        <select className="select select-bordered"
                value={statF} onChange={e=>setStatF(e.target.value)}>
          <option value="all">Status: Alle</option>
          <option value="available">Verfügbar</option>
          <option value="onTour">Unterwegs</option>
          <option value="return">Rücklauf</option>
          <option value="checked">Geprüft</option>
        </select>

        <select className="select select-bordered"
                value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="all">Typ: Alle</option>
          <option value="PU-S">PU-S</option>
          <option value="PU-M">PU-M</option>
          <option value="PR-M">PR-M</option>
        </select>

        <span>{sel.size} ausgewählt</span>
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap gap-2">
        <button onClick={()=>bulk("load")}   className="btn btn-sm btn-primary">Auslagern</button>
        <button onClick={()=>bulk("return")} className="btn btn-sm btn-accent">Zurücknehmen</button>
        <button onClick={()=>bulk("check")}  className="btn btn-sm btn-info">Prüfen</button>
        <button onClick={()=>bulk("reset")}  className="btn btn-sm">Status ↺</button>
      </div>

      {/* Tabelle */}
      <table className="table">
        <thead>
          <tr>
            <th><input type="checkbox" checked={allSel}
                       onChange={()=>setSel(allSel ? new Set() : new Set(list.map(b=>b.id)))} /></th>
            <th>Serial</th><th>Typ</th><th>Status</th><th>Cycles</th><th>Device</th>
          </tr>
        </thead>
        <tbody>
          {list.map(b => (
            <tr key={b.id}>
              <td><input type="checkbox" checked={sel.has(b.id)} onChange={()=>toggle(b.id)} /></td>
              <td>{b.serial}</td>
              <td>{b.type}</td>
              <td><StatusBadge status={b.status} /></td>
              <td>{b.cycles}</td>
              <td>{b.deviceSerial || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
