import { useState } from "react";
import api from "../utils/api.js";

export default function BackupRestore() {
  const [msg, setMsg] = useState("");

  const post = (url, body) =>
    api.post(url, body).then((r) => setMsg(r.message || "OK")).catch(setMsg);

  return (
    <main className="p-4 flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Backup &amp; Daten-Tools</h1>

      {/* Backup / Restore */}
      <section className="border rounded p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Backup</h2>

        <a href="/api/admin/backup" className="btn btn-sm btn-outline">
          Datenbank herunterladen
        </a>

        <label className="flex flex-col gap-2">
          <span>Datenbank hochladen</span>
          <input
            type="file"
            className="file-input file-input-bordered file-input-sm"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const form = new FormData();
              form.append("file", file);
              post("/api/admin/restore", form);
            }}
          />
        </label>
      </section>

      {/* Reset / Init */}
      <section className="border rounded p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Daten-Werkzeuge</h2>

        <button
          className="btn btn-sm btn-warning"
          onClick={() => post("/api/admin/reset-data")}
        >
          Box-Daten zurücksetzen
        </button>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => post("/api/admin/init-data")}
        >
          Demo-Boxen erzeugen
        </button>
      </section>

      {msg && <p className="text-green-600">{msg}</p>}
    </main>
  );
}
