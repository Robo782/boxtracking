// client/src/pages/BoxHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function BoxHistory() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [hist, setHist] = useState([]);
  const hdr        = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* Daten holen */
  useEffect(() => {
    axios.get(`/api/boxes/${id}/history`, { headers: hdr })
         .then(r => setHist(r.data))
         .catch(console.error);
  }, [id]);

  /* Zeitformat */
  const fmt = ts => ts?.replace("T"," · ").substring(0,19) || "—";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📜 Historie – Box {id}</h1>

        <button
          onClick={() => navigate("/boxes")}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          ↩ Zur Übersicht
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {hist.length === 0 && (
          <p className="text-center text-gray-600">
            Für diese Box wurden noch keine Vorgänge registriert.
          </p>
        )}

        {hist.map((h, i) => (
          <div
            key={i}
            className="relative border-l-4 border-blue-600 pl-4 pb-4 last:pb-0"
          >
            {/* Punkt */}
            <span className="absolute -left-2.5 top-0 w-4 h-4 bg-blue-600 rounded-full"></span>

            {/* Inhalt */}
            <div className="bg-white shadow-sm rounded p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="font-semibold">
                  Vorgang&nbsp;#{hist.length - i}
                </div>
                <div className="text-sm text-gray-500 flex flex-col md:flex-row md:gap-3">
                  <span>Beladen&nbsp;{fmt(h.loaded_at)}</span>
                  <span>Entladen&nbsp;{fmt(h.unloaded_at)}</span>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Detail label="PCC ID"  value={h.pcc_id         || "—"} />
                <Detail label="Device"  value={h.device_serial  || "—"} />
                <Detail label="Prüfer"  value={h.checked_by     || "—"} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* kleine Helfer-Komponente */
function Detail({ label, value }) {
  return (
    <div>
      <span className="block text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
