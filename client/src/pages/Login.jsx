// client/src/pages/Login.jsx
import { useState } from "react";
import axios        from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr     ] = useState("");
  const nav = useNavigate();

  const login = async () => {
    setErr("");
    try {
      const { data } = await axios.post("/api/auth/login", {
        email: username,     // Backend akzeptiert „email“ als username
        password,
      });
      const { token }  = data;
      const payload    = JSON.parse(atob(token.split(".")[1]));

      localStorage.setItem("token", token);
      localStorage.setItem("role",  payload.role);

      nav("/boxes");
    } catch {
      setErr("❌ Login fehlgeschlagen");
    }
  };

  const onKey = e => e.key === "Enter" && login();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-8">
        {/* Logo / Titel */}
        <h1 className="text-center text-3xl font-semibold text-white mb-8">
          📦 Box&nbsp;Tracker
        </h1>

        {/* Eingabefelder */}
        <div className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Benutzername"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />
          <input
            className="w-full px-4 py-2 rounded bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
          />
          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
          >
            Einloggen
          </button>
        </div>

        {/* Fehlermeldung */}
        {err && (
          <p className="mt-4 text-center text-red-400 text-sm">{err}</p>
        )}

        {/* Fußzeile */}
        <p className="mt-8 text-xs text-center text-slate-400">
          © {new Date().getFullYear()} Box Tracker&nbsp;· All&nbsp;rights reserved
        </p>
      </div>
    </div>
  );
}
