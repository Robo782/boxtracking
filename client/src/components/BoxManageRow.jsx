// client/src/components/BoxManageRow.jsx
import { useState } from "react";
import api from "@/utils/api";

/**
 * Eine Tabellenzeile zur Pflege einer Box
 *
 * Props
 * -----
 * box      : { id, serial, status, type }
 * onChange : setBoxes(prev => …)   // Rückgabe der aktualisierten Liste
 */
export default function BoxManageRow({ box, onChange }) {
  const [busy, setBusy] = useState(false);

  /** PATCH an /admin/boxes/:id, danach Liste aktualisieren */
  const update = patch => {
    setBusy(true);
    api.post(`/admin/boxes/${box.id}`, patch)
       .then(updated =>
         onChange(prev => prev.map(b => (b.id === updated.id ? updated : b)))
       )
       .catch(() => alert("Update fehlgeschlagen"))
       .finally(() => setBusy(false));
  };

  return (
    <tr className={busy ? "opacity-40 pointer-events-none" : ""}>
      <td>{box.serial}</td>
      <td>{box.status}</td>
      <td>{box.type}</td>
      <td className="flex gap-1">
        <button className="btn btn-xs" onClick={() => update({ status: "free" })}>
          frei
        </button>
        <button className="btn btn-xs" onClick={() => update({ status: "in-use" })}>
          in&nbsp;Ben.
        </button>
        <button className="btn btn-xs" onClick={() => update({ status: "defect" })}>
          defekt
        </button>
      </td>
    </tr>
  );
}
