import { useEffect, useState } from "react";
import api       from "@/utils/api";
import BoxCard   from "@/components/BoxCard";

export default function Boxes() {
  const [boxes, setBoxes]   = useState([]);
  const [loading, setLoad ] = useState(true);
  const [q, setQ]           = useState("");

  /* Daten laden */
  useEffect(() => {
    api.get("/boxes")
       .then(setBoxes)
       .finally(() => setLoad(false));
  }, []);

  /* Callback aus Card */
  const updateStatus = (id, next) =>
    setBoxes(prev =>
      prev.map(b => (b.id === id ? { ...b, status: next } : b))
    );

  /* Filter */
  const list = boxes.filter(b =>
    b.serial.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Boxen</h1>

      <input
        className="input input-bordered w-full mb-6"
        placeholder="Suche nach Serial …"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {loading && <p>lädt …</p>}

      {!loading && !list.length && (
        <p>Keine Boxen gefunden.</p>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {list.map(b => (
          <BoxCard key={b.id} box={b} onChange={updateStatus} />
        ))}
      </div>
    </div>
  );
}
