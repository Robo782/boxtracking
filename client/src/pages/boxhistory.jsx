// client/src/pages/boxhistory.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [serial, setSerial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    // Box-Header (Serial)
    api.get(`/boxes/${id}`)
      .then(box => { if (alive) setSerial(box.serial); })
      .catch(() => { if (alive) setSerial(id); });

    // Verlauf-Daten
    api.get(`/boxes/${id}/history`)
      .then(data => { if (alive) setEntries(Array.isArray(data) ? data : []); })
      .catch(e => { if (alive) setErr(e?.message || "Verlauf konnte nicht geladen werden"); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);

  // Zyklen 1..n (ältester zuerst)
  const cycles = useMemo(() => {
    const list = entries || [];
    return list.map((c, idx) => ({ ...c, _num: idx + 1 }));
  }, [entries]);

  return (
    <section className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Verlauf Box {serial ?? id}
        </h1>
        <p className="opacity-70 text-sm mt-1">
          Zyklus&nbsp;1 ist der älteste. Jeder Zyklus umfasst Beladen → (Entladen) → Prüfung.
        </p>
      </div>

      {loading && <p>lädt …</p>}
      {!loading && err && <p className="text-red-400">History-Fehler: {err}</p>}
      {!loading && !err && cycles.length === 0 && <p>Keine Einträge gefunden.</p>}

      {!loading && !err && !!cycles.length && (
        <div className="relative">
          {/* vertikale Linie der Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-base-300/60" />
          <div className="space-y-4">
            {cycles.map((e, i) => (
              <TimelineItem key={i} data={e} last={i === cycles.length - 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------- Einzelnes Timeline-Item -------- */
function TimelineItem({ data, last }) {
  const {
    _num, device_serial, pcc_id, loaded_at, unloaded_at,
    checked_by, damaged, damaged_at, damage_reason
  } = data;

  const isDamaged = Number(damaged) === 1 || !!damage_reason || !!damaged_at;

  return (
    <div className="relative pl-12">
      {/* Punkt auf der Timeline */}
      <span className={`absolute left-3 top-5 inline-block w-3 h-3 rounded-full ${isDamaged ? "bg-error" : "bg-success"}`} />
      {/* Verbindungslinie bis zum nächsten Item (optisch durch parent-Linie gelöst) */}
      <article className="card bg-base-200/60 shadow-sm">
        <div className="card-body p-4 sm:p-5">
          {/* Kopfbereich */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="badge badge-outline">Zyklus {_num}</span>
            {isDamaged ? (
              <span className="badge badge-error">Beschädigt</span>
            ) : (
              <span className="badge badge-success">i.O.</span>
            )}
            {damaged_at && (
              <span className="badge badge-ghost">am {fmt(damaged_at)}</span>
            )}
          </div>

          {/* Content */}
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <KV label="Beladen" value={fmt(loaded_at)} strong />
              <KV label="Gerät"  value={device_serial || "–"} />
              <KV label="PCC-ID"  value={pcc_id || "–"} />
            </div>
            <div className="space-y-1">
              <KV label="Entladen" value={fmt(unloaded_at)} />
              <KV label="Prüfer"   value={checked_by || "–"} />
              <KV label="Dauer"    value={duration(loaded_at, unloaded_at)} />
            </div>
          </div>

          {/* Schaden-Hinweis */}
          {isDamaged && (
            <div className="mt-3 border border-error/30 bg-error/10 rounded-xl p-3">
              <p className="text-error">
                <span className="font-semibold">Schaden:</span>{" "}
                {damage_reason || "ohne Angabe"}
                {damaged_at && <> &nbsp;(<em>{fmt(damaged_at)}</em>)</>}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* kleiner Abstand zur nächsten Kugel, wenn letztes Item → extra Abstand unten */}
      {last && <div className="h-2" />}
    </div>
  );
}

/* -------- kleine Hilfskomponenten -------- */
function KV({ label, value, strong = false }) {
  return (
    <p className="leading-6">
      <span className="font-semibold">{label}:</span>{" "}
      {strong ? <span className="font-medium">{value}</span> : <span className="opacity-90">{value}</span>}
    </p>
  );
}

function fmt(x) {
  if (!x) return "–";
  const d = new Date(x);
  if (Number.isNaN(+d)) return "–";
  return `${d.toLocaleDateString("de-DE")}, ${d.toLocaleTimeString("de-DE")}`;
}

function duration(a, b) {
  if (!a || !b) return "–";
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return "–";
  let ms = Math.max(0, t2 - t1);
  const h = Math.floor(ms / 3_600_000); ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000);
  if (h === 0 && m === 0) return "< 1 min";
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}
