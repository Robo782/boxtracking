// client/src/pages/BoxHistory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function BoxHistory() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [hist, setHist] = useState([]);

  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    axios
      .get(`/api/boxes/${id}/history`, { headers: hdr })
      .then((r) => setHist(r.data))
      .catch(console.error);
  }, [id]);

  const fmt = (ts) =>
    ts?.replace("T", " · ").substring(0, 19) || "—";

  return (
    <section className="max-w-lg mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Historie – Box {id}
        </h1>
        <button onClick={() => navigate("/boxes")} className="btn btn-sm">
          ↩ Zur Übersicht
        </button>
      </header>

      {hist.length === 0 && (
        <div className="alert alert-info">
          Für diese Box wurden noch keine Vorgänge registriert.
        </div>
      )}

      <ul className="timeline timeline-snap-icon timeline-vertical">
        {hist.map((h, i) => (
          <li key={h.id}>
            <div className="timeline-middle">
              <div className="badge badge-primary"></div>
            </div>
            <div className="timeline-start md:text-end mb-10">
              <time className="font-mono text-sm opacity-50">
                Vorgang #{hist.length - i}
              </time>
              <div className="text-lg font-black">Beladen</div>
              {fmt(h.loaded_at)}
            </div>
            <div className="timeline-end mb-10">
              <div className="text-lg font-black">Entladen</div>
              {fmt(h.unloaded_at)}
            </div>
            <hr />
          </li>
        ))}
      </ul>
    </section>
  );
}
