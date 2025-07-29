import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function Boxes() {
  /* ------- State -------- */
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  /* ------- Daten laden --- */
  useEffect(() => {
    api.get("/boxes")
       .then(setBoxes)
       .finally(() => setLoading(false));
  }, []);

  /* ------- Filtern -------- */
  const visible = boxes.filter(b =>
    b.serial.toLowerCase().includes(query.toLowerCase())
  );

  /* ------- UI ------------- */
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Boxen</h1>

      <input
        type="text"
        placeholder="Suche nach Serial …"
        className="input input-bordered w-full mb-4"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading && <p>lade …</p>}

      {!loading && !visible.length && (
        <p>Keine Boxen gefunden.</p>
      )}

      {!loading && visible.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Status</th>
                <th>Zyklen</th>
                <th>PCC</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(b => (
                <tr key={b.id}>
                  <td>{b.serial}</td>
                  <td>{b.status}</td>
                  <td>{b.cycles}</td>
                  <td>{b.pcc_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
