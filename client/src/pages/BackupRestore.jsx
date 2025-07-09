// client/src/pages/BackupRestore.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BackupRestore() {
  const [file,     setFile]     = useState(null);
  const [message,  setMessage]  = useState("");

  const cfg = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const handleBackup = async () => {
    try {
      const { data } = await axios.get("/api/admin/backup", { ...cfg, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a   = document.createElement("a");
      a.href = url;
      a.download = "backup.sqlite";
      a.click();
      setMessage("✅ Backup gespeichert");
    } catch {
      setMessage("❌ Backup fehlgeschlagen");
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Bitte eine Datei auswählen");
    try {
      const form = new FormData();
      form.append("file", file);
      await axios.post("/api/admin/restore", form, cfg);
      setMessage("✅ Wiederherstellung erfolgreich");
    } catch {
      setMessage("❌ Wiederherstellung fehlgeschlagen");
    }
  };

  return (
    <section className="max-w-xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💾 Backup & Restore</h1>
        <Link to="/admin" className="btn btn-sm">↩ Dashboard</Link>
      </header>

      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          {/* Backup */}
          <div>
            <h2 className="font-semibold text-lg">⬇️ Backup erstellen</h2>
            <button onClick={handleBackup} className="btn btn-primary mt-2">
              Backup herunterladen
            </button>
          </div>

          <div className="divider"></div>

          {/* Restore */}
          <form onSubmit={handleRestore} className="space-y-3">
            <h2 className="font-semibold text-lg">♻️ Backup einspielen</h2>
            <input
              type="file"
              accept=".sqlite"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input file-input-bordered w-full"
            />
            <button className="btn btn-secondary">Datenbank wiederherstellen</button>
          </form>

          {message && (
            <div className="alert alert-info text-sm mt-2">{message}</div>
          )}
        </div>
      </div>
    </section>
  );
}
