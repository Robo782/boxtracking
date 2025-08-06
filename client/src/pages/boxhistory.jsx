// client/src/pages/boxhistory.jsx
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
        setEntries(groupByCycle(data));
        if (data.length > 0) setSerial(data[0].serial);
      })
      .catch(err => {
        console.error("History-Fehler:", err);
        setEntries([]);
      });
  }, [id]);

  // Gruppiert alle Einträge nach geladenem Zeitstempel (Zyklus)
  function groupByCycle(data) {
    const grouped = {};

    data.forEach(entry => {
      const key = entry.loaded_at || `unbekannt-${Math.random()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    // Rückgabe als sortiertes Array mit Zyklusnummer
    const sorted = Object.entries(grouped)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([k, items], i) => ({ zyklus: i + 1, items }));

    return sorted;
  }

  return (
    <section className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">
        Verlauf Box {serial ?? id}
      </h1>

      {!entries.length && (
        <p className="text-gray-400">Keine Einträge gefunden.</p>
      )}

      {entries.map(({ zyklus, items }, index) => {
        const e = items[0]; // ersten Eintrag für Darstellung nutzen
        return (
          <div key={index} className="p-4 border border-base-300 rounded bg-base-100 shadow">
            <h2 className="font-semibold text-lg mb-2">Zyklus {zyklus}</h2>
            <p><strong>SN:</strong> {e.device_serial || "–"}</p>
            <p><strong>ID:</strong> {e.pcc_id || "–"}</p>
            <p><strong>Beladen:</strong> {formatDate(e.loaded_at)}</p>
            <p><strong>Entladen:</strong> {formatDate(e.unloaded_at)}</p>
            <p><strong>Geprüft von:</strong> {e.checked_by || "–"}</p>
          </div>
        );
      })}
    </section>
  );
}

function formatDate(date) {
  if (!date) return "–";
  const d = new Date(date);
  return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE");
}
