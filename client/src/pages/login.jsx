import { useState } from "react";
import { apiPost } from "@/utils/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [form,setForm] = useState({ username:"", password:"" });
  const [err ,setErr ] = useState("");

  const submit = async e => {
    e.preventDefault();
    try {
      const { token, role } = await apiPost("/api/login", form);
      localStorage.setItem("token", token);
      localStorage.setItem("role" , role );
      nav("/", {replace:true});
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={submit} className="card bg-base-200 p-8 space-y-4 w-80">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <input className="input input-bordered w-full"
               placeholder="Username"
               value={form.username}
               onChange={e=>setForm({...form,username:e.target.value})} />

        <input className="input input-bordered w-full"
               type="password"
               placeholder="Passwort"
               value={form.password}
               onChange={e=>setForm({...form,password:e.target.value})} />

        {err && <p className="text-error text-sm">{err}</p>}

        <button className="btn btn-primary w-full">Login</button>
      </form>
    </div>
  );
}
