// client/src/pages/BoxDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

/* ── Regex-Konstanten ─────────────────────────────── */
const SERIAL_RX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{2}$/;
const PCC_RX    = /^PCC \d{5} [A-Z]{2,3}$/;
const CHECK_RX  = /^[A-Za-z]{2,8}\d?$/;

export default function BoxDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [box,   setBox]   = useState(null);
  const [phase, setPhase] = useState("");

  const hdr = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  /* ── Box laden ───────────────────────────────────── */
  useEffect(() => {
    axios.get(`/api/boxes/${id}`, { headers: hdr }).then((r) => {
      setBox(r.data);
      setPhase(
        !r.data.departed                     ? "load"   :
        r.data.departed && !r.data.returned  ? "return" :
        r.data.returned && !r.data.is_checked? "check"  : "done"
      );
    });
  }, [id]);

  /* ── Speichern ──────────────────────────────────── */
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

  /* ── Validation ─────────────────────────────────── */
  const okSerial = SERIAL_RX.test((box?.device_serial || "").trim().toUpperCase());
  const okPcc    = PCC_RX.test   ((box?.pcc_id        || "").trim().toUpperCase());
  const okCheck  = CHECK_RX.test ((box?.checked_by    || "").trim().toUpperCase());

  const canSave =
    (phase === "load"   && okSerial && okPcc) ||
    (phase === "return") ||
    (phase === "check"  && okCheck && box.is_checked);

  if (!box) return <p className="p-6 text-gray-600">⏳ Lade Daten…</p>;

  /* ── UI ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Kopfzeile */}
        <div className="flex items-start sm:items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">
            📦 Box&nbsp;{box.serial}
          </h1>

          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => navigate(`/box/${id}/history`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded shadow"
            >
              Historie
            </button>
            <button
              onClick={() => navigate("/boxes")}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium px-3 py-2 rounded shadow"
            >
              ↩ Zur Übersicht
            </button>
          </div>
        </div>

        {/* Hinweis-Text */}
        {phase === "load"   && (
          <p className="text-sm text-gray-700">
            ➊ Serial <b>AAAA-AA</b> &nbsp;und&nbsp; PCC-ID
            <b> PCC&nbsp;12345&nbsp;AB/ABC</b> eingeben → Save
          </p>
        )}
        {phase === "return" && (
          <p className="text-sm text-gray-700">➋ Box angekommen → Save</p>
        )}
        {phase === "check"  && (
          <p className="text-sm text-gray-700">
            ➌ Kürzel eingeben&nbsp;✔︎ anhaken → Save
          </p>
        )}
        {phase === "done"   && (
          <p className="text-sm text-green-700">✅ Box wieder verfügbar</p>
        )}

        {/* Formular-Card */}
        {phase !== "done" && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* ── Load ── */}
            {phase === "load" && (
              <>
                {/* Device Serial */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device&nbsp;Serial
                  </label>
                  <input
                    value={box.device_serial || ""}
                    onChange={(e) =>
                      setBox({ ...box, device_serial: e.target.value })
                    }
                    className={`w-full rounded border px-3 py-2 text-sm
                      ${okSerial ? "border-gray-300" : "border-red-400"}`}
                    placeholder="AAAA-AA"
                  />
                  {!okSerial && (
                    <p className="mt-1 text-xs text-red-600">
                      Format ####-## / AAA1-23
                    </p>
                  )}
                </div>

                {/* PCC ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PCC-ID
                  </label>
                  <input
                    value={box.pcc_id || ""}
                    onChange={(e) => setBox({ ...box, pcc_id: e.target.value })}
                    className={`w-full rounded border px-3 py-2 text-sm
                      ${okPcc ? "border-gray-300" : "border-red-400"}`}
                    placeholder="PCC 12345 AB"
                  />
                  {!okPcc && (
                    <p className="mt-1 text-xs text-red-600">
                      PCC&nbsp;12345&nbsp;AB&nbsp;oder&nbsp;ABC
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Check ── */}
            {phase === "check" && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!box.is_checked}
                    onChange={(e) =>
                      setBox({ ...box, is_checked: e.target.checked })
                    }
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  Kontrolle durchgeführt
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prüfer-Kürzel
                  </label>
                  <input
                    value={box.checked_by || ""}
                    onChange={(e) =>
                      setBox({ ...box, checked_by: e.target.value })
                    }
                    className={`w-full rounded border px-3 py-2 text-sm
                      ${okCheck ? "border-gray-300" : "border-red-400"}`}
                    placeholder="AB12"
                  />
                  {!okCheck && (
                    <p className="mt-1 text-xs text-red-600">
                      2–8 Buchstaben (+ optional 1 Zahl)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Return hat keine Eingabefelder ── */}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {phase !== "done" && (
            <button
              onClick={save}
              disabled={!canSave}
              className={`bg-green-600 hover:bg-green-700 disabled:opacity-40
                          text-white text-sm font-medium px-6 py-2 rounded shadow`}
            >
              Save
            </button>
          )}
          <Link
            to="/boxes"
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium px-6 py-2 rounded shadow"
          >
            Abbrechen
          </Link>
        </div>
      </div>
    </div>
  );
}
