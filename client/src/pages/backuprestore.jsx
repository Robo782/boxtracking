import { useState } from "react";
import api from "../utils/api.js";

export default function BackupRestore() {
  const [msg, setMsg] = useState("");

  /* Hilfs-POST mit Meldung */
  const post = (url, body) =>
    api
      .post(url, body)
      .then((r) => setMsg(r.message || "OK"))
      .catch((e) => setMsg(e.message));

  return (
    <main className="p-4 flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Backup&nbsp;&amp;&nbsp;Daten-Tools</h1>

      {/* ─── Backup / Restore ───────────────────── */}
      <section className="border rounded p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Backup</h2>

        {/* Download –  KEIN doppeltes /api  */}
        <a href="/admin/backup" className="btn btn-sm btn-outline">
          Datenbank herunterladen
        </a>

        {/* Upload */}
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
              post("/admin/restore", form); //  ← nur /admin/restore
            }}
          />
        </label>
      </section>

      {/* ─── Reset / Init ───────────────────────── */}
      <section className="border rounded p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Daten-Werkzeuge</h2>

        <button
          className="btn btn-sm btn-warning"
          onClick={() => post("/admin/reset-data")}   {/*  ← ohne /api */}
        >
          Box-Daten zurücksetzen
        </button>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => post("/admin/init-data")}    {/*  ← ohne /api */}
        >
          Demo-Boxen erzeugen
        </button>
      </section>

      {msg && <p className="text-green-600">{msg}</p>}
    </main>
  );
}
