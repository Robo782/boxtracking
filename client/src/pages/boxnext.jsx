import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function BoxNext() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const action  = new URLSearchParams(useLocation().search).get("action"); // load|return|check|done

  const [box, setBox] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  /* Form-States */
  const [deviceSerial, setDeviceSerial] = useState("");
  const [pccId,        setPccId       ] = useState("");
  const [checker,      setChecker     ] = useState("");

  useEffect(() => {
    api.get(`/boxes/${id}`)
       .then(setBox)
       .catch(e => setErr(e.message));
  }, [id]);

  if (err)  return <p className="p-4 text-red-500">{err}</p>;
  if (!box) return <p className="p-4">Lade …</p>;

  const onSubmit = (e) => {
    e.preventDefault();
    setBusy(true); setErr("");

    const body =
      action === "load"  ? { device_serial: deviceSerial.trim(), pcc_id: pccId.trim() } :
      action === "check" ? { checked_by: checker.trim() } : undefined;

    api.put(`/boxes/${id}/${action}`, body)
       .then(() => nav("/boxes", { replace: true }))
       .catch(e => { setErr(e.message); setBusy(false); });
  };

  return (
    <main className="p-4 max-w-md">
      <h1 className="text-2xl font-semibold mb-6">
        {action === "load"   && `Box ${box.serial} beladen`}
        {action === "return" && `Box ${box.serial} zurückmelden`}
        {action === "check"  && `Box ${box.serial} prüfen`}
        {action === "done"   && `Wartung abschließen`}
      </h1>

      {err && <p className="text-red-500 mb-4">{err}</p>}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {action === "load" && (
          <>
            <input
              className="input input-bordered"
              placeholder="Device Serial"
              value={deviceSerial}
              onChange={e => setDeviceSerial(e.target.value)}
              required
            />
            <input
              className="input input-bordered"
              placeholder="PCC ID"
              value={pccId}
              onChange={e => setPccId(e.target.value)}
              required
            />
          </>
        )}

        {action === "check" && (
          <input
            className="input input-bordered"
            placeholder="Prüfer-Kürzel"
            value={checker}
            onChange={e => setChecker(e.target.value)}
            required
          />
        )}

        {action === "done" && (
          <p>
            Durch Klick auf <strong>Speichern</strong> wird die Box wieder
            freigegeben, <em>cycles</em> auf&nbsp;0 gesetzt und&nbsp;
            <em>maintenance _count</em> um 1 erhöht.
          </p>
        )}

        <button className="btn btn-primary mt-2" disabled={busy}>
          Speichern
        </button>
      </form>
    </main>
  );
}
