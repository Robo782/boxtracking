import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { getAuth } from "../utils/auth.js";

export default function Login() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");

  const onSubmit = (e) => {
    e.preventDefault();

    api
      .post("/auth/login", { username, password })
      .then(({ token }) => {
        localStorage.setItem("token", token);
        getAuth();              // nur um side-effects (z. B. storage-events) zu triggern
        nav("/boxes", { replace: true });   // ⬅️ immer zur Boxen-Übersicht
      })
      .catch(() => setErr("Login fehlgeschlagen"));
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-semibold mb-4">Device Box Tracker</h1>

      {err && (
        <p className="mb-2 text-red-500 border border-red-500 px-2 py-1 rounded">
          {err}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2 w-72 border p-4 rounded">
        <input
          className="input input-bordered"
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="input input-bordered"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary mt-2" type="submit">
          Login
        </button>
      </form>
    </main>
  );
}
