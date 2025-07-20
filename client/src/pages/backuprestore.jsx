import { useState } from "react";
import api from "@/utils/api";

export default function BackupRestore() {
  const [err,setErr] = useState("");

  const backup = () =>
    api.get("/admin/backup")
       .then(({url})=>window.open(url,"_blank"))
       .catch(()=>setErr("Backup fehlgeschlagen"));

  const upload = e => {
    const f = e.target.files[0];
    if(!f) return;
    const fd = new FormData(); fd.append("db",f);
    api.post("/admin/restore",fd,{file:true})
       .then(()=>alert("Import ok – Seite neu laden!"))
       .catch(()=>setErr("Import fehlgeschlagen"));
  };

  const reset = () =>
    confirm("Wirklich ALLE Daten löschen?") &&
    api.post("/admin/reset").then(()=>location.reload());

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      {err && <p className="text-error">{err}</p>}

      <div className="flex gap-2">
        <button onClick={backup} className="btn btn-primary">Backup herunterladen</button>

        <label className="btn">
          DB hochladen
          <input type="file" hidden onChange={upload} />
        </label>

        <button onClick={reset} className="btn btn-error">Zurücksetzen</button>
      </div>
    </div>
  );
}
