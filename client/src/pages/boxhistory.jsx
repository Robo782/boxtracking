import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";
import { useParams } from "react-router-dom";

export default function BoxHistory() {
  const { id }     = useParams();
  const [rows,setRows] = useState([]);
  const [err,setErr]   = useState("");

  useEffect(() => {
    apiGet(`/api/boxes/${id}/history`)
      .then(setRows)
      .catch(e=>setErr(e.message));
  }, [id]);

  if (err)  return <p className="m-4 text-error">{err}</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">History für Box {id}</h1>

      <table className="table">
        <thead><tr><th>Datum</th><th>Aktion</th><th>Info</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.date).toLocaleString()}</td>
              <td>{r.action}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
