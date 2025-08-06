import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get(`/history/${id}`).then(setData);
  }, [id]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Verlauf Box {id}</h1>

      {!data.length && <p>Keine Einträge gefunden.</p>}

      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="border border-base-300 p-4 rounded bg-base-200">
            <p><strong>SN:</strong> {item.device_serial || "-"}</p>
            <p><strong>ID:</strong> {item.pcc_id || "-"}</p>
            <p><strong>Beladen:</strong> {item.loaded_at ? new Date(item.loaded_at).toLocaleString() : "-"}</p>
            <p><strong>Entladen:</strong> {item.unloaded_at ? new Date(item.unloaded_at).toLocaleString() : "-"}</p>
            <p><strong>Prüfer:</strong> {item.checked_by || "-"}</p>
            {item.damage_reason && (
              <p className="text-red-400"><strong>Schaden:</strong> {item.damage_reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
