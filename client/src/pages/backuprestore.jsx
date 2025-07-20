import { useState } from "react";
import { apiGet, apiPost } from "@/utils/api";

export default function BackupRestore() {
  const [err, setErr] = useState("");

  const download = () =>
    apiGet("/api/admin/backup")
      .then(blob => {
        const a = document.createElement("a");
        a.href  = URL.createObjectURL(
          new Blob([JSON.stringify(blob)], {type: "application/json"})
        );
        a.download = `backup-${Date.now()}.json`;
        a.click();
      })
      .catch(e => setErr(e.message));

  const upload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await apiPost("/api/admin/restore", JSON.parse(text));
      alert("Backup eingespielt – bitte neu einloggen.");
      localStorage.clear();
      location.replace("/login");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Backup & Restore</h1>

      <button onClick={download} className="btn btn-primary">Backup herunterladen</button>

      <label className="btn">
        Backup auswählen
        <input type="file" accept=".json" hidden onChange={upload}/>
      </label>

      {err && <p className="text-error">{err}</p>}
    </div>
  );
}
