import { useParams } from "react-router-dom";
import { useState } from "react";
import useAbortableFetch from "@/hooks/useAbortableFetch";
import api from "@/utils/api";

export default function BoxHistory() {
  const { id }      = useParams();
  const [rows,setRows]= useState([]);
  const [err ,setErr ]= useState("");

  useAbortableFetch(signal=>{
    api.get(`/boxes/${id}/history`,{signal})
       .then(setRows)
       .catch(e=>e.name!=="AbortError" && setErr(e.message));
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Historie Box {id}</h1>

      {err && <p className="text-error">{err}</p>}

      <ul className="timeline timeline-vertical">
        {rows.map(r=>(
          <li key={r.t}>
            <div className="timeline-start">{new Date(r.t).toLocaleString()}</div>
            <div className="timeline-middle badge badge-info" />
            <div className="timeline-end">{r.event}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
