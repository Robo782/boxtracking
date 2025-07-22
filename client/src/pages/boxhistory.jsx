import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import api from "@/utils/api";
import useAbortableFetch from "@/hooks/useAbortableFetch";

export default function BoxHistory() {
  const { id }       = useParams();
  const [rows, setRows] = useState([]);
  const [err,  setErr ] = useState("");

  /* Daten holen */
  useAbortableFetch(signal => {
    api.get(`/boxes/${id}/history`, { signal })
       .then(setRows)
       .catch(e => e.name !== "AbortError" && setErr(e.message));
  });

  return (
    <main className="p-4">
      <Link to="/boxes" className="underline hover:no-underline">&larr; zurück</Link>

      <h1 className="text-2xl font-semibold mb-4">
        Historie Box&nbsp;#{id} &nbsp;
        <span className="text-sm font-normal">({rows.length}&nbsp;Zyklen)</span>
      </h1>

      {err && <p className="text-red-500">{err}</p>}

      {!rows.length && !err && <p>Noch keine Historie vorhanden.</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Zyklus&nbsp;#</th>
                <th>Device&nbsp;Serial</th>
                <th>PCC&nbsp;ID</th>
                <th>Loaded&nbsp;at</th>
                <th>Unloaded&nbsp;at</th>
                <th>Checked&nbsp;by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{rows.length - idx}</td>
                  <td>{r.device_serial}</td>
                  <td>{r.pcc_id}</td>
                  <td>{new Date(r.loaded_at).toLocaleString()}</td>
                  <td>{r.unloaded_at ? new Date(r.unloaded_at).toLocaleString() : "—"}</td>
                  <td>{r.checked_by ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
