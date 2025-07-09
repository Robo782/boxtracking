// client/src/pages/BoxDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

/* Regex */
const SERIAL_RX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{2}$/;
const PCC_RX    = /^PCC \d{5} [A-Z]{2,3}$/;
const CHECK_RX  = /^[A-Za-z]{2,8}\d?$/;

export default function BoxDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [box, setBox]   = useState(null);
  const [phase, setPhase] = useState("");

  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* -------- Box holen -------- */
  useEffect(() => {
    axios.get(`/api/boxes/${id}`, { headers: hdr }).then((r) => {
      setBox(r.data);
      setPhase(
        !r.data.departed
          ? "load"
          : r.data.departed && !r.data.returned
            ? "return"
            : r.data.returned && !r.data.is_checked
              ? "check"
              : "done"
      );
    });
  }, [id]);

  /* -------- Speichern -------- */
  const save = async () => {
    if (phase === "load") {
      await axios.put(
        `/api/boxes/${id}/load`,
        {
          device_serial: box.device_serial.trim().toUpperCase(),
          pcc_id:        box.pcc_id.trim().toUpperCase(),
        },
        { headers: hdr }
      );
    } else if (phase === "return") {
      await axios.put(`/api/boxes/${id}/return`, null, { headers: hdr });
    } else if (phase === "check") {
      await axios.put(
        `/api/boxes/${id}/check`,
        { checked_by: box.checked_by.trim().toUpperCase() },
        { headers: hdr }
      );
    }
    navigate("/boxes");
  };

  /* -------- Validation -------- */
  const okSerial = SERIAL_RX.test((box?.device_serial || "").trim().toUpperCase());
  const okPcc    = PCC_RX.test   ((box?.pcc_id        || "").trim().toUpperCase());
  const okCheck  = CHECK_RX.test ((box?.checked_by    || "").trim().toUpperCase());

  const canSave =
    (phase === "load"   && okSerial && okPcc) ||
    (phase === "return") ||
    (phase === "check"  && okCheck && box.is_checked);

  if (!box)
    return (
      <div className="flex items-center justify-center min-h-screen">
        ⏳ Lade Daten…
      </div>
    );

  /* -------- UI -------- */
  return (
    <section className="max-w-xl mx-auto p-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Box&nbsp;{box.serial}
        </h1>
        <div className="flex gap-2">
          <Link to={`/boxes/${id}/history`} className="btn btn-sm btn-outline">
            Historie
          </Link>
          <button onClick={() => navigate("/boxes")} className="btn btn-sm">
            ↩ Zur Übersicht
          </button>
        </div>
      </header>

      {/* Hinweis */}
      {phase === "load" && (
        <div className="alert alert-info text-sm">
          ➊ Device-Serial <code>AAAA-AA</code> <b>und</b> PCC-ID{" "}
          <code>PCC&nbsp;12345&nbsp;AB</code> eingeben → Save
        </div>
      )}
      {phase === "return" && (
        <div className="alert alert-warning text-sm">
          ➋ Box angekommen → Save
        </div>
      )}
      {phase === "check" && (
        <div className="alert alert-success text-sm">
          ➌ Kürzel eingeben&nbsp;✔︎ anhaken → Save
        </div>
      )}
      {phase === "done" && (
        <div className="alert alert-success">
          ✅ Box wieder verfügbar
        </div>
      )}

      {/* Formular-Card */}
      {phase !== "done" && (
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            {phase === "load" && (
              <>
                <label className="form-control w-full">
                  <span className="label-text">Device Serial</span>
                  <input
                    value={box.device_serial ?? ""}
                    onChange={(e) =>
                      setBox({ ...box, device_serial: e.target.value })
                    }
                    className={`input input-bordered w-full ${okSerial ? "" : "input-error"}`}
                    placeholder="AAAA-AA"
                  />
                  {!okSerial && (
                    <span className="text-error text-xs mt-1">
                      Format ####-## / AAA1-23
                    </span>
                  )}
                </label>

                <label className="form-control w-full">
                  <span className="label-text">PCC-ID</span>
                  <input
                    value={box.pcc_id ?? ""}
                    onChange={(e) => setBox({ ...box, pcc_id: e.target.value })}
                    className={`input input-bordered w-full ${okPcc ? "" : "input-error"}`}
                    placeholder="PCC 12345 AB"
                  />
                  {!okPcc && (
                    <span className="text-error text-xs mt-1">
                      PCC 12345 AB / ABC
                    </span>
                  )}
                </label>
              </>
            )}

            {phase === "check" && (
              <>
                <label className="cursor-pointer flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={box.is_checked}
                    onChange={(e) =>
                      setBox({ ...box, is_checked: e.target.checked })
                    }
                    className="checkbox checkbox-success"
                  />
                  Kontrolle durchgeführt
                </label>

                <label className="form-control w-40">
                  <span className="label-text">Prüfer-Kürzel</span>
                  <input
                    value={box.checked_by ?? ""}
                    onChange={(e) =>
                      setBox({ ...box, checked_by: e.target.value })
                    }
                    className={`input input-bordered ${okCheck ? "" : "input-error"}`}
                    placeholder="AB12"
                  />
                  {!okCheck && (
                    <span className="text-error text-xs mt-1">
                      2–8 Buchstaben (+ optional Zahl)
                    </span>
                  )}
                </label>
              </>
            )}

            {/* Buttons */}
            <div className="card-actions justify-end pt-2">
              <button
                onClick={save}
                disabled={!canSave}
                className="btn btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => navigate("/boxes")}
                className="btn btn-ghost"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
