import { useState,useMemo } from "react";
import api                 from "@/utils/api";
import useAbortableFetch   from "@/hooks/useAbortableFetch";
import FilterBar           from "@/components/FilterBar";
import BoxCard             from "@/components/BoxCard";

export default function Boxes() {
  const [boxes,setBoxes] = useState([]);
  const [stat ,setStat ] = useState("all");
  const [type ,setType ] = useState("all");
  const [query,setQuery] = useState("");
  const [err  ,setErr  ] = useState("");

  useAbortableFetch(signal=>{
    api.get("/boxes",{signal})
       .then(setBoxes)
       .catch(e=>e.name!=="AbortError" && setErr(e.message));
  });

  const list = useMemo(()=>boxes.filter(b=>{
    const q=query.toLowerCase();
    return (stat==="all"||b.status===stat) &&
           (type==="all"||b.type===type)   &&
           (!q || b.serial.toLowerCase().includes(q) ||
                (b.deviceSerial??"").toLowerCase().includes(q));
  }),[boxes,stat,type,query]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Übersicht <span className="opacity-60">{list.length}/{boxes.length}</span>
      </h1>

      <FilterBar {...{query,setQuery,stat,setStat,type,setType}} />

      {err && <p className="text-error">{err}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(b => <BoxCard key={b.id} box={b} />)}
      </div>
    </div>
  );
}
