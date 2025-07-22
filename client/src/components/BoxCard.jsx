import { Link } from "react-router-dom";

/** Liefert Klartext‐Status + „nächste Aktion“ für eine Box */
function getStatus(box) {
  if (box.departed && !box.returned)        return ["Departed", "return"];   // unterwegs
  if (box.returned && !box.is_checked)      return ["Returned",  "check"];   // zurück, wartet auf Prüfer
  if (box.is_checked)                       return ["Checked",   "load"];    // geprüft → wieder beladbar
  /* default = frei */
  return ["Available", "load"];
}

export default function BoxCard({ box }) {
  const [statusTxt, nextAction] = getStatus(box);

  return (
    <article className="border rounded p-4 flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{box.serial}</h2>

      <p>Status: <strong>{statusTxt}</strong></p>
      <p>Cycles: {box.cycles}</p>
      <p>Device: {box.device_serial ?? "—"}</p>

      <div className="mt-2 flex gap-2">
        {/* Historie */}
        <Link to={`/boxes/${box.id}/history`} className="btn btn-sm btn-outline">
          Historie
        </Link>

        {/* Nächster Schritt */}
        <Link
          to={`/boxes/${box.id}/next`}
          className="btn btn-sm btn-primary grow text-center"
        >
          Weiter&nbsp;→
        </Link>
      </div>
    </article>
  );
}
