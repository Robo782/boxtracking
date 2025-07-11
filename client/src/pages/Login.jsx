// client/src/pages/Login.jsx
import { useState }           from "react";
import { useNavigate }        from "react-router-dom";

/**
 * Einfaches Login-Formular
 *  ‣ POST /api/auth/login  { username, password }
 *  ‣ erwartet  { token, role }   role = 'admin' | 'user'
 *  ‣ speichert token & role in localStorage
 *  ‣ routed anschließend zu  /admin   oder  /boxes
 */
export default function Login() {
  const nav = useNavigate();

  const [username, setUser]     = useState("");
  const [password, setPass]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,   setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error("Ungültiger Benutzer / Passwort");
      const { token, role } = await res.json();

      localStorage.setItem("token", token);
      localStorage.setItem("role",  role);

      nav(role === "admin" ? "/admin" : "/boxes", { replace:true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
      <div className="card w-full max-w-sm shadow-xl bg-base-200">
        <div className="card-body">
          <h2 className="card-title justify-center">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              autoFocus
              className="input input-bordered w-full"
              value={username}
              onChange={e=>setUser(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              value={password}
              onChange={e=>setPass(e.target.value)}
              required
            />

            {error && <p className="text-error text-sm">{error}</p>}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading && "btn-disabled"}`}
            >
              {loading ? "…login" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
