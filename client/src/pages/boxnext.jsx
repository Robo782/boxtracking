import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function BoxNext() {
  const { id } = useParams();
  const nav    = useNavigate();

  const [box,      setBox]      = useState(null);
  const [loading,  setLoading ] = useState(true);
  const [err,      setErr ]     = useState("");
  /* Formular-States */
  const [deviceSerial, setDeviceSerial] = useState("");
  const [pccId,        setPccId       ] = useState("");
  const [checker,      setChecker     ] = useState("");

  /* ─── Box holen ───────────────────────────────────── */
  useEffect(() => {
    api.get(`/boxes/${id}`)
       .then(b => { setBox(b); setLoading(false); })
       .catch(e => { setErr(e.message); setLoading(false); });
  }, [id]);

  if (loading)  return <p className="p-4">Lade …</p>;
  if (err)      return <p className="p-4 text-red-500">{err}</p>;
  if (!box)     return null;

  /* aktuellen Schritt & Ziel ermitteln */
  let action, headline, submitLabel;
  if (box.departed && !box.returned) {
    action      = "return";
    headline    = "Box zurückbuchen";
    submitLabel = "als zurück markieren";
  } else if (box.returned && !box.is_checked) {
    action      = "check";
    headline    = "Box prüfen";
    submitLabel = "Prüfung speichern";
  } else {
    action      = "load";            // Available oder Checked
    headline    = "Box beladen";
    submitLabel = "Beladung speichern";
  }

  /* Submit */
  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const body =
      action === "load"
        ? { device_serial: deviceSerial.trim().toUpperCase(),
            pcc_id:        pccId.trim().toUpperCase() }
        : action === "check"
        ? { checked_by:   checker.trim().toUpperCase() }
        : undefined;

    api.put(`/boxes/${id}/${action}`, body)
       .then(() => nav("/boxes", { replace: true }))
       .catch(e => setErr(e.message));
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold mb-4">
        {headline} (Box {box.serial})
      </h1>

      {err && <p className="text-red-500 mb-4">{err}</p>}

      <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-md">
        {action === "load" && (
          <>
            <input
              className="input input-bordered"
              placeholder="Device Serial (z. B. 1234-AB)"
              value={deviceSerial}
              onChange={e => setDeviceSerial(e.target.value)}
              required
            />
            <input
              className="input input-bordered"
              placeholder="PCC ID (z. B. PCC 12345 XY)"
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

        {/* Bei „return“ sind keine zusätzlichen Felder nötig */}

        <button className="btn btn-primary" type="submit">
          {submitLabel}
        </button>
      </form>
    </main>
  );
}
