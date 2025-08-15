// client/src/pages/boxinspection.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/utils/api";
import ChecklistTable from "@/components/ChecklistTable.jsx";
import { getChecklistsForSerial } from "@/constants/checklists.js";

export default function BoxInspection() {
  const { id } = useParams();
  const [box, setBox] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      try {
        setErr("");
        const data = await api.get(`/boxes/${id}`, { signal: abort.signal });
        setBox(data);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Box konnte nicht geladen werden");
      }
    })();
    return () => abort.abort();
  }, [id]);

  const serial = box?.serial || box?.name || box?.pcc_id || "";
  const lists = getChecklistsForSerial(serial);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/boxes/${id}`}
          className="px-3 py-1 rounded border border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          ← Zur Box
        </Link>
        <h1 className="text-xl font-semibold text-slate-100">
          Prüfprotokoll {serial ? `für ${serial}` : ""}
        </h1>
      </div>

      {err && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 p-2 mb-4 rounded">
          {err}
        </div>
      )}

      {!box ? (
        <div className="text-slate-400">Laden…</div>
      ) : (
        <>
          <ChecklistTable title="1. Sichtprüfung" items={lists.visual} />
          <ChecklistTable title="2. Funktionsprüfung" items={lists.functional} />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-slate-300">
              <div className="text-sm mb-1">geprüft durch:</div>
              <div className="h-10 rounded-md border border-slate-700 bg-slate-900/40" />
            </div>
            <div className="text-slate-300">
              <div className="text-sm mb-1">geprüft am:</div>
              <div className="h-10 rounded-md border border-slate-700 bg-slate-900/40" />
            </div>
            <div className="text-slate-300">
              <div className="text-sm mb-1">Transportsystem freigegeben (ja / nein):</div>
              <div className="h-10 rounded-md border border-slate-700 bg-slate-900/40" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
