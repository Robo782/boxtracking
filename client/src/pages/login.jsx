import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";            // dein Fetch-Wrapper

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");

  const onSubmit = (e) => {
  e.preventDefault();
  setErr("");

  api
    .post("/auth/login", { username, password })
    .then((data) => {
      const { token } = data;
      if (!token) throw new Error("kein Token");

      localStorage.setItem("token", token);
      /*  👇 App neu informieren */
      window.dispatchEvent(new Event("authchange"));

      nav("/boxes", { replace: true });
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
