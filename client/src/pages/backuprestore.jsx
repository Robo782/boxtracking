// client/src/pages/BackupRestore.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Herkunft des Back-Ends:  ▪ im Dev via VITE_BACKEND_URL  ▪ sonst Port-Fallback
const API_ORIGIN =
  import.meta.env.VITE_BACKEND_URL ||
  window.location.origin.replace(/3000$/, "5000");

export default function BackupRestore() {
  const navigate = useNavigate();

  /* -------------- Aktionen ----------------------------------- */
  const handleDownload = () => {
    // Absolute URL → React Router interceptet NICHT → echter File-Download
    window.location.href = `${API_ORIGIN}/admin/backup`;
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    const file = e.target.elements.file?.files[0];
    if (!file) return alert("Bitte Datei auswählen");

    const formData = new FormData();
    formData.append("file", file);

    const res   = await fetch(`${API_ORIGIN}/admin/restore`, {
      method: "POST",
      body:   formData,
    });
    const json  = await res.json();
    alert(json.message || "Fertig");
  };

  /* -------------- UI ----------------------------------------- */
  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Backup&nbsp;&amp;&nbsp;Restore</h1>

      {/* Download */}
      <button
        onClick={handleDownload}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Datenbank&nbsp;herunterladen
      </button>

      {/* Restore */}
      <form onSubmit={handleRestore} className="space-y-4">
        <label className="block">
          <span className="text-gray-700">SQLite-Datei auswählen</span>
          <input
            type="file"
            name="file"
            accept=".db"
            className="mt-2 block w-full text-sm text-gray-900
                       file:mr-4 file:py-2 file:px-4
                       file:rounded file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Datenbank&nbsp;wiederherstellen
        </button>
      </form>

      <button
        onClick={() => navigate("/boxes")}
        className="text-blue-600 underline"
      >
        Zurück zur Übersicht
      </button>
    </div>
  );
}
