// client/src/pages/boxesmanage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL ?? "";

export default function BoxesManage() {
  const nav                = useNavigate();
  const [type, setType]     = useState("PU-M");
  const [count, setCount]   = useState(1);
  const [message, setMsg]   = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const res  = await fetch(`${API}/api/boxes/batch`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ type, count: Number(count) })
    });
    const json = await res.json();
    setMsg(json.message || (res.ok ? "OK" : "Fehler"));
    if (res.ok) setCount(1);
  };

  return (
    <section className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Box-Pflege</h1>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Box-Typ</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          >
            {["PU-M", "PU-S", "PR-SB", "PR-23"].map((t) => (
              <option key={t} value={t}>
                {t}-XX
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Anzahl</span>
          <input
            type="number"
            min="1"
            max="200"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Hinzufügen
        </button>
      </form>

      {message && <p className="text-center text-green-700">{message}</p>}

      <button onClick={() => nav("/boxes")} className="underline">
        Zurück zur Übersicht
      </button>
    </section>
  );
}
