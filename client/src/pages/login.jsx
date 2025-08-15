// client/src/pages/login.jsx
import { useState } from "react";
import api from "@/utils/api";
import { storeAuth } from "@/utils/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await api.post("/auth/login", {
        username: form.username.trim(),
        password: form.password,
      });
      if (!res?.token) throw new Error("Kein Token erhalten");
      const s = storeAuth(res.token);
      // Admin darf überall hin, User zu Boxen
      nav(s.role === "admin" ? "/dashboard" : "/boxes", { replace: true });
    } catch (e) {
      setErr(e.message || "Login fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl mb-4">Login</h1>
      {err && <div className="mb-3 p-2 rounded border border-red-700 bg-red-900/40 text-red-200">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full border rounded px-2 py-1 bg-transparent"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Passwort</label>
          <input
            type="password"
            className="w-full border rounded px-2 py-1 bg-transparent"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          Einloggen
        </button>
      </form>
    </div>
  );
}
