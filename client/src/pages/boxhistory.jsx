import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [serial, setSerial] = useState(null);

  useEffect(() => {
    api.get(`/boxes/${id}/history`)
      .then(data => {
        const paired = pairCycles(data);
        setEntries(paired);
        if (data.length > 0) setSerial(data[0].box_serial);
      })
      .catch(err => {
        console.error("History-Fehler:", err);
        setEntries([]);
      });
  }, [id]);

  function pairCycles(data) {
    const result = [];
    let buffer = null;

    const sorted = [...data].sort((a, b) =>
      new Date(a.loaded_at || a.unloaded_at) - new Date(b.loaded_at || b.unloaded_at)
    );

    for (const entry of sorted) {
      const hasLoad = !!entry.loaded_at;
      const hasUnload = !!entry.unloaded_at;

      if (hasLoad && !hasUnload) {
        buffer = { ...entry }; // Start neuer Zyklus
      } else if (!hasLoad && hasUnload && buffer) {
        result.push({ ...buffer, ...entry }); // Beende den Zyklus
        buffer = null;
      } else {
        result.push(entry); // Fallback (nur laden oder entladen)
        buffer = null;
      }
    }

    // falls am Ende ein Ladeeintrag übrig bleibt
    if (buffer) result.push(buffer);

    return result.map((e, i) => ({ ...e, zyklus: i + 1 }));
  }

  return (
    <section className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">
        Verlauf Box {serial ?? id}
      </h1>

      {!entries.length && (
        <p className="text-gray-400">Keine Einträge gefunden.</p>
      )}

      {entries.map((e) => (
        <div key={e.zyklus} className="p-4 border border-base-300 rounded bg-base-100 shadow">
          <h2 className="font-semibold text-lg mb-2">Zyklus {e.zyklus}</h2>
          <p><strong>SN:</strong> {e.device_serial || "–"}</p>
          <p><strong>ID:</strong> {e.pcc_id || "–"}</p>
          <p><strong>Beladen:</strong> {formatDate(e.loaded_at)}</p>
          <p><strong>Entladen:</strong> {formatDate(e.unloaded_at)}</p>
          <p><strong>Geprüft von:</strong> {e.checked_by || "–"}</p>
        </div>
      ))}
    </section>
  );
}

function formatDate(date) {
  if (!date) return "–";
  const d = new Date(date);
  return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE");
}
