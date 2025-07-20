import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";
import { useParams } from "react-router-dom";

export default function BoxDetail() {
  const { id }   = useParams();
  const [box,setBox] = useState(null);
  const [err,setErr] = useState("");

  useEffect(() => {
    apiGet(`/api/boxes/${id}`)
      .then(setBox)
      .catch(e=>setErr(e.message));
  }, [id]);

  if (err)       return <p className="m-4 text-error">{err}</p>;
  if (!box)      return <p className="m-4">Loading …</p>;

  return (
    <div className="p-6 space-y-2 max-w-md">
      <h1 className="text-2xl font-bold">{box.serial}</h1>
      <p>Status:  {box.status}</p>
      <p>Cycles:  {box.cycles}</p>
      <p>Device:  {box.device ?? "—"}</p>
    </div>
  );
}
