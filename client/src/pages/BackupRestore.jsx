// client/src/pages/BackupRestore.jsx
import { useState }   from "react";
import { Link }       from "react-router-dom";   //  ← NEU
import axios          from "axios";

export default function BackupRestore() {
  const [file, setFile]         = useState(null);
  const [message, setMessage]   = useState("");

  /* Handler … (unverändert) ------------------------------------------------ */

  return (
    <div className="p-6 space-y-6">

      {/* Kopfzeile + Zurück-Link */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">💾 Backup & Restore</h1>

        {/* ↩ Zur Übersicht */}
        <Link
          to="/boxes"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          ↩ Zur Übersicht
        </Link>
      </div>

      {/* --- Backup --- */}
      <button
        onClick={handleBackup}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Backup jetzt herunterladen
      </button>

      {/* --- Restore --- */}
      <form onSubmit={handleRestore} className="space-y-4">
        <input
          type="file"
          accept=".sqlite"
          onChange={e => setFile(e.target.files[0])}
          className="block"
        />
        <button
          type="submit"
          disabled={!file}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-4 py-2 rounded"
        >
          Datenbank wiederherstellen
        </button>
      </form>

      {/* Status-/Fehlermeldung */}
      {message && <p className="text-sm text-gray-800">{message}</p>}
    </div>
  );
}
