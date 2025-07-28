// client/src/pages/BackupRestore.jsx
import React, { useState } from "react";

/**
 * Falls du im Deployment (z. B. Render) eine eigene Origin für das Back-End hast,
 * kannst du sie über VITE_BACKEND_URL setzen.  Lokal genügt der leere String.
 * Das Formular bekommt dann automatisch eine absolute Action-URL wie
 *   https://boxtracking.onrender.com/admin/backup
 */
const API = import.meta.env.VITE_BACKEND_URL ?? "";

export default function BackupRestore() {
  /* UI-State nur für den Dateinamen im Restore-Formular */
  const [fileName, setFileName] = useState("");

  /** Restore-Submit - Datei hochladen und DB ersetzen */
  const handleRestore = async (e) => {
    e.preventDefault();
    const file = e.target.elements.file.files[0];
    if (!file) {
      alert("Bitte Datei auswählen");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res  = await fetch(`${API}/admin/restore`, {
        method: "POST",
        body  : formData,
      });
      const json = await res.json();
      alert(json.message || "Datenbank wiederhergestellt");
      /* Reset UI */
      e.target.reset();
      setFileName("");
    } catch (err) {
      console.error(err);
      alert("Upload fehlgeschlagen");
    }
  };

  return (
    <section className="max-w-xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Backup&nbsp;&amp;&nbsp;Restore</h1>

      {/* ───── BACKUP: echtes HTML-Formular (React Router ignoriert das) */}
      <form method="GET" action={`${API}/admin/backup`}>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Datenbank herunterladen
        </button>
      </form>

      {/* ───── RESTORE: Upload */}
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
    </section>
  );
}
