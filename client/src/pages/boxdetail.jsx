import { useParams } from "react-router-dom";
import { useState } from "react";
import useAbortableFetch from "@/hooks/useAbortableFetch";
import api from "@/utils/api";

export default function BoxDetail() {
  const { id }      = useParams();
  const [box,setBox]= useState(null);
  const [err,setErr]= useState("");

  useAbortableFetch(signal=>{
    api.get(`/boxes/${id}`,{signal})
       .then(setBox)
       .catch(e=>e.name!=="AbortError" && setErr(e.message));
  });

  if(err)  return <p className="p-6 text-error">{err}</p>;
  if(!box) return <p className="p-6">Lade …</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Details {box.serial}</h1>
      <pre className="bg-base-200 p-4 rounded">{JSON.stringify(box,null,2)}</pre>
    </div>
  );
}
