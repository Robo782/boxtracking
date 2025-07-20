import { useEffect, useState, useMemo } from "react";
import { api } from "../utils/api.js";

export default function BoxesManage() {
  const [boxes, setBoxes] = useState([]);
  const [sel  , setSel  ] = useState(new Set());
  const [statF, setStatF] = useState("all");
  const [typeF, setTypeF] = useState("all");

  const load = () =>
    api("/api/boxes")
      .then(r=>r.json())
      .then(setBoxes);
  useEffect(load, []);

  const list = useMemo(() => boxes.filter(b =>
    (statF==="all" || b.status===statF) &&
    (typeF==="all" || b.type  ===typeF)
  ), [boxes, statF, typeF]);

  const toggle = (id) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  const bulk = async (action) => {
    if (!sel.size) return alert("Keine Box ausgewählt.");
    await api("/api/admin/boxes/bulk", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ ids:[...sel], action }),
    });
    setSel(new Set());
    load();
  };

  const allSel = list.length>0 && list.every(b=>sel.has(b.id));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Box-Pflege</h1>

      <div className="flex gap-4 flex-wrap items-center">
        <select className="select select-bordered" value={statF} onChange={e=>setStatF(e.target.value)}>
          <option value="all">Status: Alle</option>
          <option value="available">Verfügbar</option>
          <option value="onTour">Unterwegs</option>
          <option value="return">Rücklauf</option>
          <option value="checked">Geprüft</option>
        </select>
        <select className="select select-bordered" value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="all">Typ: Alle</option>
          <option value="PU-S">PU-S</option>
          <option value="PU-M">PU-M</option>
          <option value="PR-M">PR-M</option>
        </select>
        <span>{sel.size} ausgewählt</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>bulk("load")}   className="btn btn-sm btn-primary">Auslagern</button>
        <button onClick={()=>bulk("return")} className="btn btn-sm btn-accent">Zurücknehmen</button>
        <button onClick={()=>bulk("check")}  className="btn btn-sm btn-info">Prüfen</button>
        <button onClick={()=>bulk("reset")}  className="btn btn-sm">Reset</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSel}
                onChange={()=>setSel(allSel?new Set():new Set(list.map(b=>b.id)))}
              />
            </th>
            <th>Serial</th><th>Typ</th><th>Status</th><th>Cycles</th><th>Device</th>
          </tr>
        </thead>
        <tbody>
          {list.map(b=>(
            <tr key={b.id}>
              <td><input type="checkbox" checked={sel.has(b.id)} onChange={()=>toggle(b.id)} /></td>
              <td>{b.serial}</td>
              <td>{b.type}</td>
              <td>{b.status}</td>
              <td>{b.cycles}</td>
              <td>{b.deviceSerial || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
