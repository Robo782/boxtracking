import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/boxes/${id}/history`)
      .then(res => {
        if (Array.isArray(res)) setEntries(res);
        else throw new Error("Ungültige Daten");
      })
      .catch(err => {
        setError("Fehler beim Laden der Daten");
        console.error(err);
      });
  }, [id]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Verlauf Box {id}</h1>

      {error && <p className="text-red-500">{error}</p>}

      {!entries.length && !error && (
        <p className="text-gray-400">Keine Einträge gefunden.</p>
      )}

      <ul className="space-y-4">
        {entries.map(entry => (
          <li key={entry.id} className="border border-base-300 rounded p-4">
            <p><strong>SN:</strong> {entry.device_serial}</p>
            <p><strong>ID:</strong> {entry.pcc_id}</p>
            <p><strong>Beladen:</strong> {entry.loaded_at ? new Date(entry.loaded_at).toLocaleString() : "–"}</p>
            <p><strong>Entladen:</strong> {entry.unloaded_at ? new Date(entry.unloaded_at).toLocaleString() : "–"}</p>
            <p><strong>Geprüft von:</strong> {entry.checked_by || "–"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
