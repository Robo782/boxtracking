// client/src/pages/boxhistory.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [serial, setSerial] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/boxes/${id}`)
      .then(box => setSerial(box.serial))
      .catch(() => setSerial(id));

    api.get(`/boxes/${id}/history`)
      .then(setEntries)
      .catch(e => setErr(e?.message || "Verlauf konnte nicht geladen werden"));
  }, [id]);

  return (
    <section className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Verlauf Box {serial ?? id}</h1>

      {err && <p className="text-red-400 mb-4">History-Fehler: {err}</p>}
      {!err && entries.length === 0 && <p>Keine Einträge gefunden.</p>}

      {entries.map((e, i) => {
        const isDamaged = Number(e.damaged) === 1 || !!e.damage_reason || !!e.damaged_at;
        return (
          <div key={i} className="card bg-base-200 p-4 mb-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <p><strong>Beladen:</strong> {fmt(e.loaded_at)}</p>
              <p><strong>Entladen:</strong> {fmt(e.unloaded_at)}</p>
              <p><strong>Gerät:</strong> {e.device_serial || "–"}</p>
              <p><strong>PCC-ID:</strong> {e.pcc_id || "–"}</p>
              <p><strong>Prüfer:</strong> {e.checked_by || "–"}</p>
            </div>

            <div className="mt-2">
              {isDamaged ? (
                <p className="text-red-400">
                  <strong>Beschädigt:</strong> Ja
                  {e.damaged_at && <> &nbsp;(<em>{fmt(e.damaged_at)}</em>)</>}
                  {e.damage_reason && <> — Grund: <em>{e.damage_reason}</em></>}
                </p>
              ) : (
                <p className="opacity-70"><strong>Beschädigt:</strong> Nein</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function fmt(x) {
  if (!x) return "–";
  const d = new Date(x);
  return Number.isNaN(+d) ? "–" : `${d.toLocaleDateString("de-DE")}, ${d.toLocaleTimeString("de-DE")}`;
}
