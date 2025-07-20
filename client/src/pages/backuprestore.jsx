import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";

export default function BackupRestore() {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function download() {
    setBusy(true);
    try {
      const res = await api("/api/admin/backup");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = "boxtracker-backup.sqlite";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function restore(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return alert("Bitte Datei wählen.");
    if (!confirm("Bestehende Datenbank überschreiben?")) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("dump", file);
      await api("/api/admin/backup", { method:"PUT", body:form });
      alert("Backup eingespielt – bitte neu anmelden.");
      localStorage.clear();
      nav("/login", { replace:true });
    } finally {
      setBusy(false);
    }
  }

  const resetDb = () =>
    confirm("ALLE Daten löschen?") &&
      api("/api/admin/reset", { method:"POST" })
        .then(()=>{ alert("Datenbank zurückgesetzt"); nav("/boxes"); });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <button onClick={download} className="btn btn-primary" disabled={busy}>
        {busy ? "Bitte warten …" : "Backup herunterladen"}
      </button>

      <form onSubmit={restore} className="flex gap-4 items-center flex-wrap">
        <input type="file" ref={fileRef} className="file-input file-input-bordered" />
        <button className="btn" disabled={busy}>Wiederherstellen</button>
      </form>

      <button onClick={resetDb} className="btn btn-error">Datenbank RESET</button>
    </div>
  );
}
