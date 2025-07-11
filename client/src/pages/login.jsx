// client/src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/** Hilfs-Fn: JWT-Payload dekodieren (ohne Abhängigkeiten) */
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await axios.post("/api/auth/login", form);
      const { token } = data;

      // Token & Rolle in localStorage ablegen
      localStorage.setItem("token", token);

      const { role } = parseJwt(token);
      if (role) localStorage.setItem("role", role);
      else localStorage.removeItem("role"); // Fallback

      nav("/boxes");
    } catch (err) {
      setError(
        err.response?.data?.error ?? "Login fehlgeschlagen – bitte erneut versuchen"
      );
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-base-200">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-sm shadow-lg bg-base-100 p-8"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">
          Device Box Tracker – Login
        </h1>

        <label className="form-control w-full mb-3">
          <span className="label-text">Benutzername</span>
          <input
            type="text"
            name="username"
            required
            value={form.username}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </label>

        <label className="form-control w-full mb-6">
          <span className="label-text">Passwort</span>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </label>

        {error && (
          <p className="text-error text-sm text-center mb-4">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full">
          Einloggen
        </button>
      </form>
    </div>
  );
}
