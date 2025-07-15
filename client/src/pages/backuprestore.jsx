import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BackupRestore() {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const getToken = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${getToken()}` });

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backup", { headers: hdr() });
      if (!res.ok) throw new Error("Backup fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "boxtracker-backup.sqlite",
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async e => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return alert("Bitte Datei wählen");
    if (!confirm("Bestehende DB wird überschrieben – fortfahren?")) return;

    setBusy(true);
    const form = new FormData();
    form.append("dump", file);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "PUT",
        headers: hdr(),
        body: form,
      });
      if (!res.ok) throw new Error("Restore fehlgeschlagen");
      alert("Backup eingespielt – bitte neu anmelden");
      localStorage.clear();
      nav("/login", { replace: true });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resetDb = () => {
    if (!confirm("Datenbank vollständig zurücksetzen?")) return;
    fetch("/api/admin/reset", {
      method: "POST",
      headers: hdr(),
    })
      .then(() => {
        alert("Datenbank zurückgesetzt");
        location.reload();
      })
      .catch(() => alert("Fehler beim Reset"));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <button onClick={download} className="btn btn-primary" disabled={busy}>
        {busy ? "Lade…" : "Backup herunterladen"}
      </button>

      <form onSubmit={restore} className="flex gap-4 items-center flex-wrap">
        <input type="file" ref={fileRef} className="file-input file-input-bordered" />
        <button className="btn" disabled={busy}>Wiederherstellen</button>
      </form>

      <button onClick={resetDb} className="btn btn-error">Datenbank RESET</button>
    </div>
  );
}
