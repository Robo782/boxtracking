// client/src/pages/Boxes.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Boxes() {
  const [boxes,  setBoxes]  = useState([]);
  const [query,  setQuery]  = useState("");
  const [result, setResult] = useState([]);

  /* Rolle & JWT aus localStorage */
  const role = localStorage.getItem("role");
  const hdr  = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* ------- Übersicht laden ------- */
  const fetchBoxes = () =>
    axios.get("/api/boxes", { headers: hdr })
         .then(r => setBoxes(r.data))
         .catch(console.error);

  useEffect(() => { fetchBoxes(); }, []);        // initial laden

  /* ------- Suche ------- */
  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return setResult([]);
    try {
      const r = await axios.get("/api/boxes/search", { params: { q }, headers: hdr });
      setResult(r.data);
    } catch (err) {
      alert(err.response?.data?.error || "Suche fehlgeschlagen");
    }
  };

  /* ------- Reset (nur Admin) ------- */
  const resetDb = async () => {
    if (!window.confirm("Datenbank wirklich zurücksetzen?")) return;
    await axios.post("/api/admin/reset", null, { headers: hdr });
    alert("Box-Werte wurden zurückgesetzt");
    fetchBoxes();
  };

  /* ------- Helper ------- */
  const status = (b) =>
    !b.departed ? "📍 verfügbar"
      : b.returned
        ? (b.is_checked ? "✅ geprüft" : "🕐 Rücklauf offen")
        : "📦 unterwegs";

  const action = (b) =>
    !b.departed ? "Kiste auslagern"
      : b.departed && !b.returned ? "Kiste zurücknehmen"
      : b.returned && !b.is_checked ? "Überprüfung"
      : "Kiste auslagern";

  return (
    <div style={{ padding: 20 }}>
      {/* Kopfzeile */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ margin:0 }}>📦 Übersicht</h1>

        {/* Buttons nur für Admin */}
        {role === "admin" && (
          <div style={{ display:"flex", gap:8 }}>
            <Link to="/admin/boxes-manage"><button>Box-Verwaltung</button></Link>
            <Link to="/admin"><button>Admin-Bereich</button></Link>
            <button onClick={resetDb}>DB Reset</button>
          </div>
        )}
      </div>

      {/* Suchleiste */}
      <form onSubmit={runSearch} style={{ marginTop: 15 }}>
        <input
          placeholder="PCC-ID oder Device-Serial"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: 260 }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>Search</button>
        {result.length > 0 && (
          <button type="button" onClick={()=>setResult([])} style={{ marginLeft: 8 }}>
            Clear
          </button>
        )}
      </form>

      {/* Suchergebnis */}
      {result.length > 0 && (
        <>
          <h3>Suchergebnis</h3>
          <table border="1" cellPadding="6" style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ background:"#f0f0f0" }}>
              <tr><th>PCC-ID</th><th>Device</th><th>Prüfer</th><th>Kiste</th></tr>
            </thead>
            <tbody>
              {result.map((r,i)=>(
                <tr key={i}>
                  <td>{r.pcc_id}</td>
                  <td>{r.device_serial}</td>
                  <td>{r.checked_by || "-"}</td>
                  <td>{r.box_serial}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
        </>
      )}

      {/* Gesamtliste aller Boxen */}
      <table border="1" cellPadding="8"
             style={{ width:"100%", borderCollapse:"collapse", marginTop:10 }}>
        <thead style={{ background:"#f0f0f0" }}>
          <tr>
            <th>Serial</th><th>Status</th><th>Cycles</th><th>Device</th><th colSpan={2}>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map(b=>(
            <tr key={b.id}>
              <td>{b.serial}</td>
              <td>{status(b)}</td>
              <td>{b.cycles}</td>
              <td>{b.device_serial || "-"}</td>
              <td><a href={`/box/${b.id}`}><button>{action(b)}</button></a></td>
              <td><a href={`/box/${b.id}/history`}><button>History</button></a></td>
            </tr>
          ))}
          {boxes.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign:"center", padding:20 }}>Keine Boxen gefunden</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
