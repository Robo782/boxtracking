import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";

export default function BoxCard({ box, onChange }) {
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [device, setDevice] = useState("");
  const [pcc, setPcc] = useState("");
  const [insp, setInsp] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [reason, setReason] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setModal(null);
    setDevice(""); setPcc(""); setInsp(""); setReason("");
    setDamaged(false); setC1(false); setC2(false); setC3(false);
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
        setError(err.response?.data?.message || "Fehler beim Statuswechsel");
      })
      .finally(() => setBusy(false));
  };

  const handleNext = () => {
    if (box.status === "available") setModal("departed");
    else if (box.status === "departed") sendNext({});
    else if (box.status === "returned") setModal("returned");
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

  return (
    <div
      className="card bg-base-200 shadow-md p-4 hover:cursor-pointer hover:bg-base-300 transition-all"
      onClick={handleCardClick}
    >
      <h2 className="font-semibold text-lg">{box.serial}</h2>
      <p className="mt-1 mb-2">
        <span className="opacity-60">Status:</span> {box.status}
      </p>

      <p className="text-sm mb-1">
        Zyklen {box.cycles} · Maint {box.maintenance_count}
      </p>

      {box.device_serial && (
        <p className="text-xs opacity-60">
          SN {box.device_serial} · ID {box.pcc_id}
        </p>
      )}
      {box.checked_by && (
        <p className="text-xs opacity-60">Prüfer {box.checked_by}</p>
      )}

      <button
        className={`btn btn-sm mt-4 ${getButtonClass()}`}
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

      {/* ─── Modal: Prüfung ───────────────────────────── */}
      {modal === "returned" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Prüfung</h3>
            <input className="input input-bordered w-full mb-3"
              placeholder="Prüfer-Kürzel"
              value={insp} onChange={e => setInsp(e.target.value)} />
            <div className="form-control mb-2">
              <label className="cursor-pointer label">
                <span className="label-text">Reinigung durchgeführt</span>
                <input type="checkbox" className="checkbox" checked={c1} onChange={e => setC1(e.target.checked)} />
              </label>
              <label className="cursor-pointer label">
                <span className="label-text">Sichtkontrolle</span>
                <input type="checkbox" className="checkbox" checked={c2} onChange={e => setC2(e.target.checked)} />
              </label>
              <label className="cursor-pointer label">
                <span className="label-text">Funktionstest</span>
                <input type="checkbox" className="checkbox" checked={c3} onChange={e => setC3(e.target.checked)} />
              </label>
            </div>

            <label className="cursor-pointer label">
              <span className="label-text text-red-400">Box beschädigt?</span>
              <input type="checkbox" className="checkbox checkbox-error"
                checked={damaged} onChange={e => setDamaged(e.target.checked)} />
            </label>

            {damaged && (
              <textarea
                className="textarea textarea-bordered w-full mt-3"
                placeholder="Schadensbeschreibung"
                value={reason} onChange={e => setReason(e.target.value)} />
            )}

            {error && <p className="text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-sm" onClick={close}>Abbrechen</button>
              <button className="btn btn-sm btn-info"
                onClick={() => {
                  if (!insp) return setError("Prüfer fehlt");
                  if (damaged && reason.trim().length < 3) return setError("Schadensbegründung fehlt");
                  if (!damaged && (!c1 || !c2 || !c3)) return setError("Alle Punkte müssen bestätigt sein");
                  sendNext({
                    inspector: insp,
                    damaged,
                    damage_reason: damaged ? reason.trim() : null,
                    checklist1: c1,
                    checklist2: c2,
                    checklist3: c3
                  });
                }}>
                Speichern
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
