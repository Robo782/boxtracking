import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [serial, setSerial] = useState(null);

  useEffect(() => {
    // Seriennummer für Überschrift
    api.get(`/boxes/${id}`)
      .then(box => setSerial(box.serial))
      .catch(() => setSerial(id));

    // Zyklen sind jetzt bereits serverseitig korrekt gruppiert
    api.get(`/boxes/${id}/history`)
      .then(data => setEntries(data.map((e, i) => ({ ...e, zyklus: i + 1 }))))
      .catch(err => {
        console.error("History-Fehler:", err);
        setEntries([]);
      });
  }, [id]);

  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Verlauf Box {serial ?? id}</h1>

      {!entries.length && (
        <p className="text-gray-400">Keine Einträge gefunden.</p>
      )}

      {entries.map((e) => (
        <div key={e.zyklus} className="p-4 border border-base-300 rounded bg-base-100 shadow">
          <h2 className="font-semibold text-lg mb-2">Zyklus {e.zyklus}</h2>
          <p><strong>SN:</strong> {e.device_serial || "–"}</p>
          <p><strong>ID:</strong> {e.pcc_id || "–"}</p>
          <p><strong>Beladen:</strong> {fmt(e.loaded_at)}</p>
          <p><strong>Entladen:</strong> {fmt(e.unloaded_at)}</p>
          <p><strong>Geprüft von:</strong> {e.checked_by || "–"}</p>
        </div>
      ))}
    </section>
  );
}

function fmt(dt) {
  if (!dt) return "–";
  const d = new Date(dt);
  return isNaN(d) ? "–" : `${d.toLocaleDateString("de-DE")}, ${d.toLocaleTimeString("de-DE")}`;
}
