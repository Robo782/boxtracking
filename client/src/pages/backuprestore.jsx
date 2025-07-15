/* client/src/pages/backuprestore.jsx */
import { useRef, useState } from "react";

export default function BackupRestore() {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);

  const hdr = () => ({ Authorization:`Bearer ${localStorage.getItem("token")}` });

  /* ---- Dump holen ---- */
  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backup", { headers: hdr() });
      if (!res.ok) throw new Error("Backup fehlgeschlagen");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), {
        href:url, download:"boxtracker-backup.sqlite",
      }).click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---- Restore ---- */
  const restore = async e => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return alert("Bitte Datei wählen");
    if (!confirm("Bestehende DB wird überschrieben – fortfahren?")) return;

    setBusy(true);
    const form = new FormData(); form.append("dump", file);
    try {
      const res = await fetch("/api/admin/backup",
        { method:"PUT", headers: hdr(), body: form });
      if (!res.ok) throw new Error("Restore fehlgeschlagen");
      alert("Backup eingespielt – bitte erneut anmelden");
      location.href = "/login";
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---- Reset ---- */
  const resetDb = () =>
    confirm("Alle Daten löschen?") &&
    fetch("/api/admin/reset", { method:"POST", headers: hdr() })
      .then(()=>{ alert("Datenbank zurückgesetzt"); location.reload(); });

  /* ---- UI ---- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <button onClick={download} className="btn btn-primary">
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
