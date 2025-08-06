// client/src/pages/BackupRestore.jsx
import React, { useState } from "react";
import api from "@/utils/api";

const API = import.meta.env.VITE_BACKEND_URL ?? "";

export default function BackupRestore() {
  const [fileName, setFileName] = useState("");
  const [resetting, setResetting] = useState(false);

  /** Wiederherstellung (Upload einer SQLite-Datei) */
  const handleRestore = async (e) => {
    e.preventDefault();
    const file = e.target.elements.file.files[0];
    if (!file) return alert("Bitte Datei auswählen");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/admin/restore`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      alert(json.message || "Datenbank wiederhergestellt");
      e.target.reset();
      setFileName("");
    } catch (err) {
      console.error(err);
      alert("Upload fehlgeschlagen");
    }
  };

  /** Reset (alle Inhalte löschen) */
  const handleReset = async () => {
    const confirmed = confirm(
      "Willst du wirklich ALLE Box- und Verlaufsdaten löschen?\nDiese Aktion ist NICHT umkehrbar!"
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      await api.delete("/backup/clear");
      alert("Alle Inhalte wurden erfolgreich gelöscht.");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen: " + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Backup&nbsp;&amp;&nbsp;Restore</h1>

      {/* ─── Backup: Datei herunterladen ─── */}
      <form method="GET" action={`${API}/admin/backup`}>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Datenbank herunterladen
        </button>
      </form>

      {/* ─── Restore: Datei hochladen ─── */}
      <form onSubmit={handleRestore} className="space-y-4">
        <label className="block">
          <span className="sr-only">SQLite-Datei wählen</span>
          <input
            type="file"
            name="file"
            accept=".sqlite,.db"
            onChange={(e) =>
              setFileName(e.target.files[0] ? e.target.files[0].name : "")
            }
            className="file:mr-3 file:rounded file:border-0
                     file:bg-blue-50 file:px-4 file:py-2
                     file:text-sm file:font-semibold file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </label>
        <span className="block text-sm text-gray-400">
          {fileName || "Keine ausgewählt"}
        </span>
        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Wiederherstellen
        </button>
      </form>

      {/* ─── Reset: Inhalte löschen ─── */}
      <div>
        <hr className="my-6 border-gray-500" />
        <button
          onClick={handleReset}
          disabled={resetting}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {resetting ? "Lösche Daten …" : "Inhalte löschen (Reset)"}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Entfernt alle Boxen und Verlaufsdaten. Struktur bleibt erhalten.
        </p>
      </div>
    </section>
  );
}
