import { Link } from "react-router-dom";

export default function BoxCard({ box })
{
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 space-y-1">
        <h2 className="card-title">{box.serial}</h2>
        <p>Status: {box.status}</p>
        <p>Cycles: {box.cycles}</p>
        <p>Device: {box.deviceSerial ?? "—"}</p>

        <div className="flex gap-2 pt-2">
          <Link to={`/boxes/${box.id}`} className="link">Details</Link>
          <Link to={`/boxes/${box.id}/manage`} className="link">Manage</Link>
        </div>
      </div>
    </div>
  );
}
