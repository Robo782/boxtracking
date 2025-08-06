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

  return (
    <div
      className="card bg-base-200 shadow-md p-4 hover:cursor-pointer hover:bg-base-300 transition-all"
      onClick={() => navigate(`/boxhistory/${box.id}`)}
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
          e.stopPropagation(); // verhindert Öffnen der History beim Buttonklick
          handleNext();
        }}
        disabled={busy}
      >
        {busy ? "…" : getActionLabel()}
      </button>

      {/* Die bestehenden Modals (departed / returned) bleiben unverändert */}
      {/* … */}
    </div>
  );
}
