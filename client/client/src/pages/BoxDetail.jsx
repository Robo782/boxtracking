import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const SERIAL_RX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{2}$/;
const PCC_RX    = /^PCC \d{5} [A-Z]{2,3}$/;          // Grossbuchstaben
const CHECK_RX  = /^[A-Za-z]{2,8}\d?$/;

export default function BoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [box, setBox]   = useState(null);
  const [phase, setPhase] = useState("");

  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* Box laden */
  useEffect(() => {
    axios.get(`/api/boxes/${id}`, { headers: hdr }).then(r => {
      setBox(r.data);
      setPhase(
        !r.data.departed              ? "load"   :
        r.data.departed && !r.data.returned ? "return" :
        r.data.returned && !r.data.is_checked ? "check" : "done"
      );
    });
  }, [id]);

  /* Speichern */
  const save = async () => {
    if (phase === "load") {
      await axios.put(`/api/boxes/${id}/load`, {
        device_serial: box.device_serial.trim().toUpperCase(),
        pcc_id:        box.pcc_id.trim().toUpperCase()
      }, { headers: hdr });
    } else if (phase === "return") {
      await axios.put(`/api/boxes/${id}/return`, null, { headers: hdr });
    } else if (phase === "check") {
      await axios.put(`/api/boxes/${id}/check`, {
        checked_by: box.checked_by.trim().toUpperCase()
      }, { headers: hdr });
    }
    navigate("/boxes");
  };

  /* Validierungen (mit Uppercase) */
  const okSerial = SERIAL_RX.test((box?.device_serial || "").trim().toUpperCase());
  const okPcc    = PCC_RX.test((box?.pcc_id        || "").trim().toUpperCase());
  const okCheck  = CHECK_RX.test((box?.checked_by   || "").trim().toUpperCase());

  const canSave =
    (phase === "load"   && okSerial && okPcc) ||
    (phase === "return") ||
    (phase === "check"  && okCheck && box.is_checked);

  if (!box) return <p>Lade Daten…</p>;

  return (
    <div style={{ padding: 20, maxWidth: 540 }}>
      <h2>Box {box.serial}</h2>

      {phase === "load" && (
        <p>➊ Serial <b>AAAA-AA</b> und PCC-ID
           <b> PCC&nbsp;12345&nbsp;AB/ABC</b> eingeben → Save.</p>
      )}
      {phase === "return" && <p>➋ Box angekommen → Save.</p>}
      {phase === "check"  && <p>➌ Kürzel & Haken → Save.</p>}
      {phase === "done"   && <p>✅ Box wieder verfügbar.</p>}

      {phase === "load" && (
        <>
          <label>Device Serial:&nbsp;
            <input value={box.device_serial || ""}
                   onChange={e => setBox({ ...box, device_serial: e.target.value })}
                   style={{ borderColor: okSerial ? "" : "red" }} />
          </label>
          {!okSerial && <p style={{ color: "red" }}>Format ####-## / AAA1-23</p>}

          <br />
          <label>PCC-ID:&nbsp;
            <input value={box.pcc_id || ""}
                   onChange={e => setBox({ ...box, pcc_id: e.target.value })}
                   style={{ borderColor: okPcc ? "" : "red" }} />
          </label>
          {!okPcc && <p style={{ color: "red" }}>PCC 12345 AB&nbsp;oder&nbsp;ABC</p>}
        </>
      )}

      {phase === "check" && (
        <>
          <label>
            <input type="checkbox"
                   checked={!!box.is_checked}
                   onChange={e => setBox({ ...box, is_checked: e.target.checked })}/>
            &nbsp;Kontrolle durchgeführt
          </label><br />
          <label>Kürzel:&nbsp;
            <input value={box.checked_by || ""}
                   onChange={e => setBox({ ...box, checked_by: e.target.value })}
                   style={{ borderColor: okCheck ? "" : "red" }} />
          </label>
          {!okCheck && <p style={{ color: "red" }}>2–8 Buchst., optional 1 Zahl</p>}
        </>
      )}

      <br/><br/>
      {phase !== "done" &&
        <button onClick={save} disabled={!canSave}>Save</button>}
      <button style={{ marginLeft: 10 }} onClick={() => navigate("/boxes")}>
        Zurück
      </button>
      <button style={{ marginLeft: 10 }} onClick={() => navigate(`/box/${id}/history`)}>
        Historie
      </button>
    </div>
  );
}
