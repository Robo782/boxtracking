import { useState } from "react";
import useAbortableFetch from "@/hooks/useAbortableFetch";
import api from "@/utils/api";
import BoxManageRow from "@/components/BoxManageRow";

export default function BoxesManage() {
  const [boxes,setBoxes] = useState([]);
  const [err ,setErr ]   = useState("");

  useAbortableFetch(signal=>{
    api.get("/admin/boxes",{signal})
       .then(setBoxes)
       .catch(e=>e.name!=="AbortError" && setErr(e.message));
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Box-Pflege</h1>
      {err && <p className="text-error">{err}</p>}

      <table className="table">
        <thead><tr><th>ID</th><th>Status</th><th>Typ</th><th>Aktionen</th></tr></thead>
        <tbody>
          {boxes.map(b => <BoxManageRow key={b.id} box={b} onChange={setBoxes} />)}
        </tbody>
      </table>
    </div>
  );
}
