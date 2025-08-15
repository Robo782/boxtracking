// client/src/components/ChecklistTable.jsx
import { useMemo } from "react";

export default function ChecklistTable({ title, items = [] }) {
  const rows = useMemo(
    () => items.map((it) => ({ ...it })),
    [items]
  );

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/40 mb-6">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60 text-slate-100 font-medium">
          {title}
        </div>
      )}
      <table className="w-full">
        <thead className="bg-slate-800/60">
          <tr className="text-left text-slate-300">
            <th className="p-3 border-b border-slate-700 w-16">Nr.</th>
            <th className="p-3 border-b border-slate-700 w-64">Nr. des Prüfpunktes</th>
            <th className="p-3 border-b border-slate-700">Beschreibung des Prüfpunktes</th>
            <th className="p-3 border-b border-slate-700 w-32">In Ordnung</th>
            <th className="p-3 border-b border-slate-700 w-36">nicht In Ordnung</th>
            <th className="p-3 border-b border-slate-700 w-64">Kommentar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.nr}
              className="odd:bg-slate-900/30 even:bg-slate-900/10 hover:bg-slate-800/30 transition-colors"
            >
              <td className="p-3 border-b border-slate-800 text-slate-300">{r.nr}</td>
              <td className="p-3 border-b border-slate-800 text-slate-100">{r.title}</td>
              <td className="p-3 border-b border-slate-800 text-slate-300">{r.desc}</td>
              <td className="p-3 border-b border-slate-800 text-slate-300"></td>
              <td className="p-3 border-b border-slate-800 text-slate-300"></td>
              <td className="p-3 border-b border-slate-800 text-slate-300"></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-slate-500">
                Keine Prüfpunkte vorhanden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
