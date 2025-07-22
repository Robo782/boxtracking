import { useEffect, useState } from "react";
import BoxCard from "../components/BoxCard.jsx";
import api from "../utils/api.js";

export default function Boxes() {
  const [boxes,  setBoxes]  = useState([]);
  const [filter, setFilter] = useState("");

  /* Daten laden --------------------------------------------------------- */
  useEffect(() => {
    reload();
  }, []);

  const reload = () => {
    api
      .get("/boxes")                    // /api/boxes via utils/api.js
      .then((data) => {
        /* Fallback, falls der Server eine Fehlermeldung (Objekt) schickt */
        setBoxes(Array.isArray(data) ? data : []);
      })
      .catch(() => setBoxes([]));
  };

  /* Filter -------------------------------------------------------------- */
  const term = filter.toLowerCase();
  const shown = boxes.filter(
    (b) =>
      b.serial.toLowerCase().includes(term) ||
      (b.device_serial ?? "").toLowerCase().includes(term)
  );

  /* UI ------------------------------------------------------------------ */
  return (
    <main className="p-4 flex flex-col gap-4">
      <input
        className="input input-bordered w-full max-w-xs"
        placeholder="Suche nach Serial / Device …"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {!shown.length ? (
        <p className="text-gray-400">Keine Boxen gefunden.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => (
            <BoxCard key={b.id} box={b} />
          ))}
        </div>
      )}
    </main>
  );
}
