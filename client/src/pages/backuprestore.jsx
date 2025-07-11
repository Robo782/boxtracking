// client/src/pages/BackupRestore.jsx
import { useState } from "react";

const token = localStorage.getItem("token");

export default function BackupRestore() {
  const [downloading, setDL] = useState(false);
  const [restoring,   setRS] = useState(false);

  /* ---------- Backup herunterladen ---------- */
  async function downloadDump() {
    setDL(true);
    try {
      const res = await fetch("/api/admin/backup", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Backup fehlgeschlagen");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url,
        download: "boxtracker-backup.sqlite",
      });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    finally     { setDL(false);     }
  }

  /* ---------- Backup hochladen ---------- */
  async function restore(e) {
    e.preventDefault();
    const file = e.target.dump.files[0];
    if (!file) { alert("Bitte Datei wählen"); return; }
    if (!confirm("Bestehende DB wird überschrieben – sicher?")) return;

    setRS(true);
    const form = new FormData(); form.append("dump", file);
    try {
      const res = await fetch("/api/admin/backup", {
        method : "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body   : form
      });
      if (!res.ok) throw new Error("Restore fehlgeschlagen");
      alert("Backup erfolgreich eingespielt – Seite wird neu geladen");
      location.href = "/login";
    } catch (e) { alert(e.message); }
    finally     { setRS(false);     }
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <div className="card bg-base-200 shadow p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Backup herunterladen</h2>
        <button onClick={downloadDump}
                className={`btn btn-primary ${downloading && "btn-disabled"}`}>
          {downloading ? "Erstelle …" : "Dump herunterladen"}
        </button>
      </div>

      <form onSubmit={restore}
            className="card bg-base-200 shadow p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Backup einspielen</h2>
        <input name="dump" type="file"
               accept=".sqlite,.db"
               className="file-input file-input-bordered w-full" />
        <button className={`btn btn-error ${restoring && "btn-disabled"}`}>
          {restoring ? "Stelle wieder her …" : "Wiederherstellen"}
        </button>
      </form>
    </div>
  );
}
