import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Backup / Restore / Reset
 * – liest Token immer erst IM Funktions­körper
 * – kein Full Reload mehr, Navigation via react-router
 */
export default function BackupRestore() {
  /* ----------------- Hooks ----------------- */
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  /* ----------------- Helpers ---------------- */
  const token = () => localStorage.getItem("token");
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  /* ----------------- Aktionen --------------- */
  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backup", { headers: headers() });
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
  }

  async function restore(e) {
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
        headers: headers(),
        body: form,
      });
      if (!res.ok) throw new Error("Restore fehlgeschlagen");
      alert("Backup eingespielt – bitte neu anmelden");
      localStorage.clear();              // Token & Rolle löschen
      nav("/login", { replace: true });  // Soft-Redirect
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetDb() {
    if (!confirm("Datenbank vollständig zurücksetzen?")) return;
    try {
      await fetch("/api/admin/reset", { method: "POST", headers: headers() });
      alert("Datenbank zurückgesetzt");
      nav("/boxes");                     // Soft-Redirect statt Full Reload
    } catch {
      alert("Reset fehlgeschlagen");
    }
  }

  /* ----------------- UI -------------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup / Restore</h1>

      <button className="btn btn-primary" onClick={download} disabled={busy}>
        {busy ? "Bitte warten …" : "Backup herunterladen"}
      </button>

      <form
        onSubmit={restore}
        className="flex gap-4 items-center flex-wrap"
      >
        <input
          type="file"
          ref={fileRef}
          className="file-input file-input-bordered"
        />
        <button className="btn" disabled={busy}>
          Wiederherstellen
        </button>
      </form>

      <button className="btn btn-error" onClick={resetDb}>
        Datenbank RESET
      </button>
    </div>
  );
}
