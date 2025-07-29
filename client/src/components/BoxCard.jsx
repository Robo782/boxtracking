import { useState } from "react";
import api from "@/utils/api";

export default function BoxCard({ box, onChange }) {
  const [busy, setBusy]     = useState(false);
  const [modal, setModal]   = useState(null);   // "departed" | "returned"
  const [device, setDevice] = useState("");
  const [pcc,    setPcc]    = useState("");
  const [insp,   setInsp]   = useState("");

  /* ----- Callback wenn OK ------------------------------------------ */
  const sendNext = body => {
    setBusy(true);
    api.patch(`/boxes/${box.id}/nextStatus`, body)
       .then(({ next }) => {
         onChange(box.id, { ...body, status: next });
         close();
       })
       .finally(() => setBusy(false));
  };

  /* ----- Klickbehandler -------------------------------------------- */
  const handleNext = () => {
    if (box.status === "available")     setModal("departed");
    else if (box.status === "departed") sendNext({});
    else if (box.status === "returned") setModal("returned");
    else if (box.status === "maintenance") sendNext({});
  };

  const close = () => {
    setModal(null); setDevice(""); setPcc(""); setInsp("");
  };

  /* ----- UI --------------------------------------------------------- */
  return (
    <div className="card bg-base-200 shadow-md p-4">
      <h2 className="font-semibold text-lg">{box.serial}</h2>
      <p className="mt-1 mb-2">
        <span className="opacity-60">Status:</span> {box.status}
      </p>

      <p className="text-sm mb-1">
        Zyklen {box.cycles} · Maint {box.maintenance_count}
      </p>

      {box.device_serial && (
        <p className="text-xs opacity-60">
          Device {box.device_serial} · PCC {box.pcc_id}
        </p>
      )}
      {box.checked_by && (
        <p className="text-xs opacity-60">Prüfer {box.checked_by}</p>
      )}

      <button
        className="btn btn-sm btn-primary mt-4"
        onClick={handleNext}
        disabled={busy}
      >
        {busy ? "…" : "Nächster Status"}
      </button>

      {/* Modal: Abfahrt ------------------------------------------------ */}
      {modal === "departed" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Abfahrt eintragen</h3>
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Device-Serial"
              value={device}
              onChange={e => setDevice(e.target.value)}
              required
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="PCC-ID"
              value={pcc}
              onChange={e => setPcc(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={close}>Abbrechen</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() =>
                  sendNext({ device_serial: device, pcc_id: pcc })
                }
                disabled={!device || !pcc || busy}
              >
                Speichern
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal: Rückkehr prüfen --------------------------------------- */}
      {modal === "returned" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Prüfung abschließen</h3>
            <p className="text-sm mb-2">
              Bitte Prüfer-Kürzel eingeben.<br />
              (Box hat {box.cycles + 1} Zyklen)
            </p>
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Kürzel"
              value={insp}
              onChange={e => setInsp(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={close}>Abbrechen</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => sendNext({ inspector: insp })}
                disabled={!insp || busy}
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
