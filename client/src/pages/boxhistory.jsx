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
        if (!data || !data.length) return setEntries([]);

        // Seriennummer aus dem ersten Eintrag extrahieren
        if (data[0].serial) setSerial(data[0].serial);
        const grouped = groupByRealCycle(data);
        setEntries(grouped);
      })
      .catch(err => {
        console.error("History-Fehler:", err);
        setEntries([]);
      });
  }, [id]);

  /** Gruppiert realistische Zyklen:
   * jeder Zyklus = beladen → entladen → geprüft
   */
  function groupByRealCycle(data) {
    const grouped = [];
    let current = null;

    data.forEach(entry => {
      const hasLoad = !!entry.loaded_at;

      if (hasLoad) {
        if (current) grouped.push(current); // vorherigen abschließen
        current = {
          serial: entry.device_serial,
          pcc_id: entry.pcc_id,
          loaded_at: entry.loaded_at,
          unloaded_at: entry.unloaded_at,
          checked_by: entry.checked_by
        };
      } else if (current) {
        // Ergänze unload/prüfer im gleichen Zyklus
        current.unloaded_at ??= entry.unloaded_at;
        current.checked_by ??= entry.checked_by;
      }
    });

    if (current) grouped.push(current);

    return grouped.reverse(); // neuester Zyklus zuerst
  }

  return (
    <section className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">
        Verlauf Box {serial ?? id}
      </h1>

      {!entries.length && (
        <p className="text-gray-400">Keine Einträge gefunden.</p>
      )}

      {entries.map((e, index) => (
        <div key={index} className="p-4 border border-base-300 rounded bg-base-100 shadow">
          <h2 className="font-semibold text-lg mb-2">
            Zyklus {entries.length - index}
          </h2>
          <p><strong>SN:</strong> {e.serial || "–"}</p>
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
