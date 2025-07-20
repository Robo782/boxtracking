import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/utils/api";
import { useParams } from "react-router-dom";

export default function BoxesManage() {
  const { id }       = useParams();
  const [box, setBox]= useState(null);
  const [err, setErr]= useState("");

  const load = () =>
    apiGet(`/api/admin/boxes/${id}`)
      .then(setBox)
      .catch(e => setErr(String(e)));

  useEffect(load, [id]);

  const save = () => {
    apiPut(`/api/admin/boxes/${id}`, { ...box })
      .then(() => alert("Gespeichert ✓"))
      .catch(e  => alert(e.message));
  };

  if (err) return <p className="m-4 text-error">{err}</p>;
  if (!box) return <p className="m-4">Loading …</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Box {box.serial} bearbeiten</h1>

      <label className="form-control w-full max-w-md">
        <span className="label-text">Typ</span>
        <input value={box.type}
               onChange={e => setBox({...box,type:e.target.value})}
               className="input input-bordered" />
      </label>

      <button className="btn btn-primary" onClick={save}>Speichern</button>
    </div>
  );
}
