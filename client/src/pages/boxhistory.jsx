/* client/src/pages/boxhistory.jsx */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function BoxHistory() {
  const { id } = useParams();                     // serial
  const [rows, setRows] = useState(null);
  const [box , setBox ] = useState(null);
  const [err , setErr ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const hdr   = { Authorization:`Bearer ${token}` };

        const [bRes, hRes] = await Promise.all([
          fetch(`/api/boxes/${id}`,           { headers: hdr }),
          fetch(`/api/boxes/${id}/history`,   { headers: hdr }),
        ]);
        if (!bRes.ok) throw new Error("Box existiert nicht");
        if (!hRes.ok) throw new Error("Keine Historie gefunden");

        setBox(await bRes.json());
        setRows(await hRes.json());
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  if (err)  return <p className="p-6 text-error">{err}</p>;
  if (!box) return <p className="p-6">Lade …</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Verlauf – {box.serial} <span className="opacity-60">{box.type}</span>
      </h1>

      {rows?.length === 0 && <p>Noch keine Historie.</p>}

      {rows?.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Datum</th><th>Aktion</th><th>Bemerkung</th></tr>
          </thead>
          <tbody>
            {rows.map(ev => (
              <tr key={ev.id}>
                <td>{new Date(ev.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${color(ev.action)}`}>
                    {ev.action}
                  </span>
                </td>
                <td>{ev.comment || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to={`/box/${box.serial}`} className="link block mt-4">← zurück</Link>
    </div>
  );
}

function color(a) {
  switch (a) {
    case "load":   return "primary";
    case "return": return "accent";
    case "check":  return "success";
    default:       return "neutral";
  }
}
