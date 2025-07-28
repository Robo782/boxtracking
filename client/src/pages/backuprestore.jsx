// client/src/pages/BackupRestore.jsx
import React from "react";

const API =
  import.meta.env.VITE_BACKEND_URL    // z. B. "https://boxtracking.onrender.com"
  ?? window.location.origin.replace(/3000$/, "10000"); // Dev-Fallback

export default function BackupRestore() {
  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup &amp; Restore</h1>

      {/* Download: absolute URL → kein React-Router-Intercept  */}
      <a
        href={`${API}/admin/backup`}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        download
      >
        Datenbank herunterladen
      </a>

      {/* Restore */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const file = e.target.elements.file.files[0];
          if (!file) return alert("Bitte Datei wählen");

          const res  = await fetch(`${API}/admin/restore`, {
            method: "POST",
            body  : (() => { const f=new FormData(); f.append("file", file); return f; })(),
          });
          const json = await res.json();
          alert(json.message);
        }}
        className="space-y-4"
      >
        <input type="file" name="file" accept=".db,.sqlite" />
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
