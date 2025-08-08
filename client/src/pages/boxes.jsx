import { useEffect, useRef, useState } from "react";
import api from "@/utils/api";
import BoxCard from "@/components/BoxCard";

export default function Boxes() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoad] = useState(true);
  const [q, setQ] = useState("");
  const timer = useRef(null);

  // Initial load
  useEffect(() => {
    let alive = true;
    setLoad(true);
    api.get("/boxes")
      .then(data => { if (alive) setBoxes(data); })
      .finally(() => { if (alive) setLoad(false); });
    return () => { alive = false; };
  }, []);

  // Debounced server-side search (inkl. Historie via Backend)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const term = q.trim();
      const url = term.length
        ? `/boxes?search=${encodeURIComponent(term)}`
        : "/boxes";
      setLoad(true);
      api.get(url)
        .then(setBoxes)
        .finally(() => setLoad(false));
    }, 300);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  // Callback: nach Statuswechsel lokalen State aktualisieren
  const updateStatus = (id, nextData) =>
    setBoxes(prev => prev.map(b => (b.id === id ? { ...b, ...nextData } : b)));

  const list = boxes; // bereits serverseitig gefiltert

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Boxen</h1>

      <input
        className="input input-bordered w-full mb-6"
        placeholder="Suche: Serial, PCC-ID oder Geräte-Seriennummer (inkl. Historie) …"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {loading && <p>lädt …</p>}
      {!loading && !list.length && <p>Keine Boxen gefunden.</p>}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {list.map(b => (
          <BoxCard key={b.id} box={b} onChange={updateStatus} />
        ))}
      </div>
    </div>
  );
}
