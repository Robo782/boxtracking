import { useState } from "react";
import api from "@/utils/api";

export default function BoxCard({ box, onChange }) {
  const [loading, setLoading] = useState(false);

  const changeStatus = () => {
    setLoading(true);
    api.patch(`/boxes/${box.id}/nextStatus`)
       .then(({ next }) => onChange(box.id, next))
       .finally(() => setLoading(false));
  };

  return (
    <div className="card bg-base-200 shadow-md p-4">
      <h2 className="font-semibold text-lg mb-1">{box.serial}</h2>

      <p className="mb-2">
        <span className="opacity-60">Status:</span> {box.status}
      </p>
      <p className="text-sm mb-4">
        Zyklen: {box.cycles} · Wartungen: {box.maintenance_count}
      </p>

      <button
        className="btn btn-sm btn-primary"
        onClick={changeStatus}
        disabled={loading}
      >
        {loading ? "…" : "Nächster Status"}
      </button>
    </div>
  );
}
