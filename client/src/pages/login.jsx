// client/src/pages/Login.jsx
import { useState }   from "react";
import { useNavigate } from "react-router-dom";
import api             from "@/utils/api";

export default function Login() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState(""); // Benutzername ODER Mail
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");

    api.post("/auth/login", { identifier: identifier.trim(), password })
       .then(({ token }) => {
         if (!token) throw new Error("kein Token");
         localStorage.setItem("token", token);
         window.dispatchEvent(new Event("authchange"));
         nav("/boxes", { replace: true });
       })
       .catch(() => setError("Login fehlgeschlagen"));
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-semibold mb-6">Device Box Tracker</h1>

      {error && (
        <p className="mb-3 text-red-500 border border-red-500 px-3 py-1 rounded">
          {error}
        </p>
      )}

      <form onSubmit={submit}
            className="w-80 flex flex-col gap-3 border p-6 rounded-lg bg-black/10">

        <input
          className="input input-bordered"
          type="text"
          placeholder="Benutzername oder E-Mail"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
