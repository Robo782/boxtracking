// client/src/pages/BoxHistory.jsx
import { useEffect, useState } from "react";
import { useParams, Link }     from "react-router-dom";

const token = localStorage.getItem("token");

export default function BoxHistory() {
  const { id }        = useParams();
  const [rows, setRows] = useState(null);
  const [box,  setBox ] = useState(null);
  const [err,  setErr ] = useState("");

  /* Daten holen ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const hdr = { Authorization:`Bearer ${token}` };

        const [boxRes, histRes] = await Promise.all([
          fetch(`/api/boxes/${id}`,          { headers: hdr }),
          fetch(`/api/boxes/${id}/history`,  { headers: hdr }),
        ]);

        if (!boxRes.ok)  throw new Error("Box existiert nicht");
        if (!histRes.ok) throw new Error("Keine Historie gefunden");

        setBox(await boxRes.json());
        setRows(await histRes.json());
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  /* Rendering ------------------------------------------------------ */
  if (err)      return <p className="p-4 text-error">{err}</p>;
  if (!box)     return <p className="p-4">Lade …</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        Verlauf – {box.serial}
        <span className="badge badge-outline">{box.type}</span>
      </h1>

      {rows?.length === 0 && (
        <p className="opacity-60">Noch keine Historie.</p>
      )}

      {rows?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-36">Datum</th>
                <th className="w-32">Aktion</th>
                <th>Bemerkung</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(ev => (
                <tr key={ev.id}>
                  <td>{new Date(ev.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-sm badge-${color(ev.action)}`}>
                      {ev.action}
                    </span>
                  </td>
                  <td>{ev.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link to={`/boxes/${id}`} className="link mt-4 inline-block">
        ← zurück
      </Link>
    </div>
  );
}

/* kleine Farbmap --------------------------------------------------- */
function color(action) {
  switch (action) {
    case "load":   return "primary";
    case "return": return "accent";
    case "check":  return "success";
    default:       return "neutral";
  }
}
