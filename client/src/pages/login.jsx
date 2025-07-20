import { useState }   from "react";
import { useNavigate } from "react-router-dom";
import api             from "@/utils/api";

export default function Login() {
  const nav = useNavigate();
  const [user,setUser] = useState("");
  const [pass,setPass] = useState("");
  const [err ,setErr ] = useState("");

  const onSubmit = e => {
  e.preventDefault();
  api.post("/auth/login", { username, password })
     .then(({ token }) => {
       localStorage.setItem("token", token);
       navigate("/dashboard");
     })
     .catch(() => setErr("Login fehlgeschlagen"));
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Device Box Tracker</h1>

      <form onSubmit={submit} className="card w-80 bg-base-200 p-6 space-y-4">
        {err && <p className="text-error text-center">{err}</p>}

        <input className="input input-bordered w-full"
               placeholder="User" value={user} onChange={e=>setUser(e.target.value)} required />

        <input className="input input-bordered w-full"
               type="password" placeholder="Passwort"
               value={pass} onChange={e=>setPass(e.target.value)} required />

        <button className="btn btn-primary w-full">Login</button>
      </form>
    </div>
  );
}
