import { Link } from "react-router-dom";

const MAX_CYCLES = 50;

function getAction(box) {
  switch (box.status) {
    case "departed":    return ["Beladen & unterwegs",  "Zurückmelden", "return"];
    case "returned":    return ["Zurück ungeprüft",      "Prüfen",       "check"];
    case "maintenance": return ["In Wartung",           "Wartung ✔",    "done"];
    default:            // available
      return ["Verfügbar", box.cycles >= MAX_CYCLES ? "Wartung ✔" : "Beladen",
              box.cycles >= MAX_CYCLES ? "done" : "load"];
  }
}

export default function BoxCard({ box }) {
  const [statusTxt, btnLabel, next] = getAction(box);

  return (
    <article className="border rounded p-4 flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{box.serial}</h2>

      <p>Status: <strong>{statusTxt}</strong></p>
      <p>Zyklen: {box.cycles}</p>
      <p>Wartungen: {box.maintenance_count}</p>
      <p>Device: {box.device_serial ?? "—"}</p>

      <div className="mt-2 flex gap-2">
        <Link to={`/boxes/${box.id}/history`} className="btn btn-sm btn-outline">
          Historie
        </Link>

        <Link
          to={`/boxes/${box.id}/next?action=${next}`}
          className={`btn btn-sm grow text-center ${
            next === "done" ? "btn-success" : "btn-primary"
          }`}
        >
          {btnLabel}
        </Link>
      </div>
    </article>
  );
}
