import { useState } from "react";
import api from "@/utils/api";

export default function BoxCard({ box, onChange }) {
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // "departed" | "returned"
  const [device, setDevice] = useState("");
  const [pcc, setPcc] = useState("");
  const [insp, setInsp] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const close = () => {
    setModal(null);
    setDevice("");
    setPcc("");
    setInsp("");
    setDamaged(false);
    setC1(false);
    setC2(false);
    setC3(false);
  };

  const sendNext = (body) => {
    setBusy(true);
    api
      .patch(`/boxes/${box.id}/nextStatus`, body)
      .then(({ next }) => {
        onChange(box.id, { ...body, status: next });
        close();
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Fehler beim Statuswechsel");
      })
      .finally(() => setBusy(false));
  };

  const handleNext = () => {
    if (box.status === "available") setModal("departed");
    else if (box.status === "departed") sendNext({});
    else if (box.status === "returned") setModal("returned");
    else if (box.status === "maintenance") sendNext({});
  };

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

      {/* Modal für Beladung */}
      {modal === "departed" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Abfahrt eintragen</h3>
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Device-Serial (xxxx-yy)"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              required
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="PCC-ID (pcc 12345 zz)"
              value={pcc}
              onChange={(e) => setPcc(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={close}>
                Abbrechen
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => sendNext({ device_serial: device, pcc_id: pcc })}
              >
                Speichern
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal für Rückgabeprüfung */}
      {modal === "returned" && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-semibold mb-3">Prüfung abschließen</h3>
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Prüfer-Kürzel"
              value={insp}
              onChange={(e) => setInsp(e.target.value)}
              required
            />
            <div className="form-control mb-2">
              <label className="cursor-pointer label">
                <span className="label-text">Reinigung durchgeführt</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={c1}
                  onChange={(e) => setC1(e.target.checked)}
                />
              </label>
              <label className="cursor-pointer label">
                <span className="label-text">Sichtkontrolle</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={c2}
                  onChange={(e) => setC2(e.target.checked)}
                />
              </label>
              <label className="cursor-pointer label">
                <span className="label-text">Funktionstest</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={c3}
                  onChange={(e) => setC3(e.target.checked)}
                />
              </label>
            </div>
            <label className="cursor-pointer label">
              <span className="label-text text-red-400">Box beschädigt?</span>
              <input
                type="checkbox"
                className="checkbox checkbox-error"
                checked={damaged}
                onChange={(e) => setDamaged(e.target.checked)}
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-sm" onClick={close}>
                Abbrechen
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() =>
                  sendNext({
                    inspector: insp,
                    checklist1: c1,
                    checklist2: c2,
                    checklist3: c3,
                    damaged,
                  })
                }
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
