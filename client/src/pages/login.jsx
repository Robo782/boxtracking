// client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";               // dein bestehenden Fetch-Wrapper

export default function Login() {
  const nav = useNavigate();

  const [identifier, setId]   = useState("");   // ← vorher „username“
  const [password,   setPw]   = useState("");
  const [err,        setErr]  = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");

    api
      .post("/auth/login", { identifier, password })   // ← neues Payload
      .then((data) => {
        const { token } = data;
        if (!token) throw new Error("kein Token");

        localStorage.setItem("token", token);
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

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 w-72 border p-4 rounded"
      >
        {/* Identifier: Benutzername ODER E-Mail */}
        <input
          className="input input-bordered"
          type="text"
          placeholder="Benutzer oder E-Mail"
          value={identifier}
          onChange={(e) => setId(e.target.value)}
          required
        />

        <input
          className="input input-bordered"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPw(e.target.value)}
          required
        />

        <button className="btn btn-primary mt-2" type="submit">
          Login
        </button>
      </form>
    </main>
  );
}
