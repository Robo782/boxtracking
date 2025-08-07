import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [serial, setSerial] = useState(null);

  useEffect(() => {
    // Hole Seriennummer separat
    api.get(`/boxes/${id}`).then((box) => {
      setSerial(box.serial);
    });

    api.get(`/boxes/${id}/history`)
      .then((data) => {
        const prepared = data.map((e, i) => ({ ...e, zyklus: i + 1 }));
        setEntries(prepared);
      })
      .catch(err => {
        console.error("History-Fehler:", err);
        setEntries([]);
      });
  }, [id]);

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
