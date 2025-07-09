// client/src/pages/BackupRestore.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BackupRestore() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  /* ------------- Handler (unverändert lassen) ------------- */
  const handleBackup = async () => {
    /* ... */
  };
  const handleRestore = async (e) => {
    /* ... */
  };
  /* -------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      {/* Kopfzeile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">
          💾 Backup&nbsp;&amp;&nbsp;Restore
        </h1>

        <Link
          to="/boxes"
          className="mt-4 sm:mt-0 inline-block bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded shadow"
        >
          ↩ Zur Übersicht
        </Link>
      </div>

      {/* Aktions-Card */}
      <div className="max-w-xl space-y-8">
        {/* Backup */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-lg font-medium text-gray-700">🔄 Backup erstellen</h2>
          <button
            onClick={handleBackup}
            className="self-start bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            Backup herunterladen
          </button>
        </div>

        {/* Restore */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-lg font-medium text-gray-700">♻️ Backup einspielen</h2>

          <form onSubmit={handleRestore} className="flex flex-col gap-4">
            <input
              type="file"
              accept=".sqlite"
              onChange={(e) => setFile(e.target.files[0])}
              className="file:mr-4 file:py-2 file:px-4
                         file:rounded file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />

            <button
              type="submit"
              disabled={!file}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40
                         text-white text-sm font-medium px-4 py-2 rounded self-start"
            >
              Datenbank wiederherstellen
            </button>
          </form>

          {message && (
            <p className="text-sm text-gray-600 border-t pt-4">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
