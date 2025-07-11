import { useRef, useState } from "react";

export default function BackupRestore() {
  const token    = localStorage.getItem("token");
  const fileRef  = useRef();
  const [busy, setBusy] = useState(false);

  /* ---------- Backup herunterladen ---------- */
  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backup", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url,
        download: "boxtracker-backup.sqlite",
      });
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Backup fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Backup einspielen ---------- */
  const restore = async e => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return alert("Bitte Datei wählen");
    if (!confirm("Bestehende Datenbank wird überschrieben – fortfahren?")) return;

    setBusy(true);
    const form = new FormData();
    form.append("dump", file);

    try {
      const res = await fetch("/api/admin/backup", {
        method : "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body   : form,
      });
      if (!res.ok) throw new Error();
      alert("Backup eingespielt – bitte erneut anmelden");
      location.href = "/login";
    } catch {
      alert("Restore fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Reset ---------- */
  const resetDb = () =>
    confirm("ALLE Daten löschen?") &&
    fetch("/api/admin/reset", {
      method : "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      alert("Datenbank zurückgesetzt");
      location.reload();
    });

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <button onClick={download} className="btn btn-primary">
        {busy ? "Bitte warten …" : "Backup herunterladen"}
      </button>

      <form onSubmit={restore} className="flex gap-4 items-center flex-wrap">
        <input type="file" ref={fileRef} className="file-input file-input-bordered" />
        <button className="btn" disabled={busy}>
          Wiederherstellen
        </button>
      </form>

      <button onClick={resetDb} className="btn btn-error">
        Datenbank RESET
      </button>
    </div>
  );
}
