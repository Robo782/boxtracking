import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function BoxHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hist, setHist] = useState([]);
  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    axios.get(`/api/boxes/${id}/history`, { headers: hdr })
         .then(r => setHist(r.data))
         .catch(console.error);
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Historie – Box {id}</h2>
      <button onClick={() => navigate("/boxes")}>Zurück zur Übersicht</button>

      <table border="1" cellPadding="6"
             style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead style={{ background: "#f0f0f0" }}>
          <tr><th>#</th><th>PCC ID</th><th>Device</th><th>Beladen</th><th>Entladen</th><th>Prüfer</th></tr>
        </thead>
        <tbody>
          {hist.map((h, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{h.pcc_id}</td>
              <td>{h.device_serial}</td>
              <td>{h.loaded_at  ?.replace("T"," ").substring(0,19) || "-"}</td>
              <td>{h.unloaded_at?.replace("T"," ").substring(0,19) || "-"}</td>
              <td>{h.checked_by || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
