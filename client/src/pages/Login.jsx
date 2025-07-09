// client/src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [err,      setErr]        = useState("");
  const nav = useNavigate();

  const login = async () => {
    setErr("");
    try {
      const { data } = await axios.post("/api/auth/login", {
        email: username,
        password,
      });
      const { token } = data;
      const payload   = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("token", token);
      localStorage.setItem("role",  payload.role);
      nav("/boxes");
    } catch {
      setErr("❌ Login fehlgeschlagen");
    }
  };
  const onKey = (e) => e.key === "Enter" && login();

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm shadow-lg bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center">Device Box Tracker</h1>

          <input
            type="text"
            placeholder="E-Mail / Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onKey}
            autoFocus
            className="input input-bordered w-full"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            className="input input-bordered w-full"
          />

          {err && <div className="text-error text-sm">{err}</div>}

          <button onClick={login} className="btn btn-primary w-full mt-2">
            Einloggen
          </button>
        </div>
      </div>
    </main>
  );
}
