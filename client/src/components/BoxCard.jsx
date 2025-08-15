// client/src/components/BoxCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { getChecklistsForSerial } from "@/constants/checklists";

export default function BoxCard({ box, onChange }) {
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [device, setDevice] = useState("");
  const [pcc, setPcc] = useState("");
  const [insp, setInsp] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [reason, setReason] = useState("");
  const [c1, setC1] = useState(false); // Reinigung durchgeführt
  const [error, setError] = useState("");

  // Neue Zustände für die Checklisten
  const [vRows, setVRows] = useState([]); // Sichtprüfung
  const [fRows, setFRows] = useState([]); // Funktionsprüfung

  const close = () => {
    setModal(null);
    setDevice(""); setPcc(""); setInsp(""); setReason("");
    setDamaged(false); setC1(false);
    setVRows([]); setFRows([]);
    setError("");
  };

  const sendNext = (body) => {
    setBusy(true);
    api.patch(`/boxes/${box.id}/nextStatus`, body)
      .then(res => {
        onChange(box.id, { ...body, status: res.next });
        close();
      })
      .catch(err => {
        setError(err?.message || err?.response?.data?.message || "Fehler beim Statuswechsel");
      })
      .finally(() => setBusy(false));
  };

  const initChecklists = () => {
    const lists = getChecklistsForSerial(box.serial || "");
    setVRows(lists.visual.map(it => ({ ...it, status: null, comment: "" })));
    setFRows(lists.functional.map(it => ({ ...it, status: null, comment: "" })));
  };

  const handleNext = () => {
    if (box.status === "available") setModal("departed");
    else if (box.status === "departed") sendNext({});
    else if (box.status === "returned") { initChecklists(); setModal("returned"); }
    else if (box.status === "maintenance") sendNext({});
    else if (box.status === "damaged") sendNext({ inspector: "admin" });
  };

  const getActionLabel = () => {
    switch (box.status) {
      case "available": return "Box beladen";
      case "departed": return "Box zurücknehmen";
      case "returned": return "Prüfung abschließen";
      case "maintenance": return "Wartung abschließen";
      case "damaged": return "Freigeben";
      default: return "Aktion";
    }
  };

  const getButtonClass = () => {
    switch (box.status) {
      case "available": return "btn-success";
      case "departed": return "btn-warning";
      case "returned": return "btn-info";
      case "maintenance": return "btn-accent";
      case "damaged": return "btn-error";
      default: return "btn-neutral";
    }
  };

  const handleCardClick = (e) => {
    const target = e.target;
    if (
      target.closest("button") ||
      target.closest("dialog") ||
      modal !== null
    ) return;
    navigate(`/boxes/${box.id}/history`);
  };

  // kleine Hilfen für die Checklisten
  const setRow = (type, nr, patch) => {
    const setter = type === "visual" ? setVRows : setFRows;
    const arr = type === "visual" ? vRows : fRows;
    setter(arr.map(r => r.nr === nr ? { ...r, ...patch } : r));
  };
  const allAnswered = (rows) => rows.length > 0 && rows.every(r => r.status === "ok" || r.status === "nok");
  const allOk = (rows) => rows.length > 0 && rows.every(r => r.status === "ok");
  const anyNok = () => [...vRows, ...fRows].some(r => r.status === "nok");

  return (
    <div
      className="card bg-base-200 shadow-md p-4 hover:cursor-pointer hover:bg-base-300 transition-all"
      onClick={handleCardClick}
    >
      <h2 className="font-semibold text-lg">{box.serial}</h2>
      <p className="mt-1 mb-2">
        <span className="opacity-60">Status:</span> {box.status}
      </p>

      <p className="text-sm opacity-60">
        Zyklus {box.cycles || 0} · Maint {box.maintenance_count || 0}
      </p>

      <button
        className={["btn btn-sm mt-4", getButtonClass()].join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={busy}
      >
        {busy ? "…" : getActionLabel()}
      </button>

      {/* ─── Modal: Box beladen ───────────────────────── */}
      {modal === "departed" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Box beladen</h3>
            <input className="input input-bordered w-full mb-3"
              placeholder="SN (xxxx-yy)"
              value={device} onChange={e => setDevice(e.target.value)} />
            <input className="input input-bordered w-full mb-3"
              placeholder="ID (pcc 12345 zz)"
              value={pcc} onChange={e => setPcc(e.target.value)} />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={close}>Abbrechen</button>
              <button className="btn btn-sm btn-success"
                onClick={() => sendNext({ device_serial: device, pcc_id: pcc })}>
                Speichern
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* ─── Modal: Prüfung (NEU – echte Checklisten) ───────────────── */}
      {modal === "returned" && (
        <dialog open className="modal">
          <div className="modal-box max-w-5xl">
            <h3 className="font-semibold mb-3">Prüfung</h3>

            <input className="input input-bordered w-full mb-3"
              placeholder="Prüfer-Kürzel"
              value={insp} onChange={e => setInsp(e.target.value)} />

            <label className="cursor-pointer label">
              <span className="label-text">Reinigung durchgeführt</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={c1}
                onChange={e => setC1(e.target.checked)}
              />
            </label>

            <div className="divider my-3">1. Sichtprüfung</div>
            <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/40 mb-4">
              <table className="w-full">
                <thead className="bg-slate-800/60">
                  <tr className="text-left text-slate-300">
                    <th className="p-3 border-b border-slate-700 w-14">Nr.</th>
                    <th className="p-3 border-b border-slate-700 w-60">Prüfpunkt</th>
                    <th className="p-3 border-b border-slate-700">Beschreibung</th>
                    <th className="p-3 border-b border-slate-700 w-28">OK</th>
                    <th className="p-3 border-b border-slate-700 w-36">nicht OK</th>
                    <th className="p-3 border-b border-slate-700 w-64">Kommentar</th>
                  </tr>
                </thead>
                <tbody>
                  {vRows.map(r => (
                    <tr key={r.nr} className="odd:bg-slate-900/30 even:bg-slate-900/10">
                      <td className="p-3 border-b border-slate-800 text-slate-300">{r.nr}</td>
                      <td className="p-3 border-b border-slate-800 text-slate-100">{r.title}</td>
                      <td className="p-3 border-b border-slate-800 text-slate-300">{r.desc}</td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          type="radio"
                          name={`vis-${r.nr}`}
                          className="radio"
                          checked={r.status === "ok"}
                          onChange={() => setRow("visual", r.nr, { status: "ok" })}
                        />
                      </td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          type="radio"
                          name={`vis-${r.nr}`}
                          className="radio radio-error"
                          checked={r.status === "nok"}
                          onChange={() => { setRow("visual", r.nr, { status: "nok" }); setDamaged(true); }}
                        />
                      </td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          className="input input-bordered w-full"
                          placeholder="Kommentar"
                          value={r.comment || ""}
                          onChange={e => setRow("visual", r.nr, { comment: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divider my-3">2. Funktionsprüfung</div>
            <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/40">
              <table className="w-full">
                <thead className="bg-slate-800/60">
                  <tr className="text-left text-slate-300">
                    <th className="p-3 border-b border-slate-700 w-14">Nr.</th>
                    <th className="p-3 border-b border-slate-700 w-60">Prüfpunkt</th>
                    <th className="p-3 border-b border-slate-700">Beschreibung</th>
                    <th className="p-3 border-b border-slate-700 w-28">OK</th>
                    <th className="p-3 border-b border-slate-700 w-36">nicht OK</th>
                    <th className="p-3 border-b border-slate-700 w-64">Kommentar</th>
                  </tr>
                </thead>
                <tbody>
                  {fRows.map(r => (
                    <tr key={r.nr} className="odd:bg-slate-900/30 even:bg-slate-900/10">
                      <td className="p-3 border-b border-slate-800 text-slate-300">{r.nr}</td>
                      <td className="p-3 border-b border-slate-800 text-slate-100">{r.title}</td>
                      <td className="p-3 border-b border-slate-800 text-slate-300">{r.desc}</td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          type="radio"
                          name={`fun-${r.nr}`}
                          className="radio"
                          checked={r.status === "ok"}
                          onChange={() => setRow("functional", r.nr, { status: "ok" })}
                        />
                      </td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          type="radio"
                          name={`fun-${r.nr}`}
                          className="radio radio-error"
                          checked={r.status === "nok"}
                          onChange={() => { setRow("functional", r.nr, { status: "nok" }); setDamaged(true); }}
                        />
                      </td>
                      <td className="p-3 border-b border-slate-800">
                        <input
                          className="input input-bordered w-full"
                          placeholder="Kommentar"
                          value={r.comment || ""}
                          onChange={e => setRow("functional", r.nr, { comment: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <label className="cursor-pointer label">
                <span className="label-text text-red-400">Box beschädigt?</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-error"
                  checked={damaged || anyNok()}
                  onChange={e => setDamaged(e.target.checked)}
                />
              </label>
              {(damaged || anyNok()) && (
                <textarea
                  className="textarea textarea-bordered w-full mt-2"
                  placeholder="Schadensbeschreibung"
                  value={reason} onChange={e => setReason(e.target.value)}
                />
              )}
            </div>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-sm" onClick={close}>Abbrechen</button>
              <button
                className="btn btn-sm btn-info"
                onClick={() => {
                  const visualAnswered = allAnswered(vRows);
                  const functionalAnswered = allAnswered(fRows);
                  const visualOK = allOk(vRows);
                  const functionalOK = allOk(fRows);
                  const isDamaged = damaged || anyNok();

                  if (!insp) return setError("Prüfer fehlt");
                  if (!c1) return setError("Reinigung bestätigen");
                  if (!visualAnswered || !functionalAnswered) return setError("Alle Prüfpunkte bewerten (OK / nicht OK)");
                  if (isDamaged && reason.trim().length < 3) return setError("Schadensbegründung fehlt");

                  // Server-API kompatibel halten:
                  sendNext({
                    inspector: insp,
                    damaged: isDamaged,
                    damage_reason: isDamaged ? reason.trim() : null,
                    checklist1: c1,               // Reinigung
                    checklist2: visualOK,         // Sichtkontrolle bestanden
                    checklist3: functionalOK      // Funktionstest bestanden
                  });
                }}
              >
                Speichern
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
