import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]           = useState('');
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post('/api/auth/login', {
        email: username,    // wird im Backend als "username" verwendet
        password,
      });

      const token = res.data.token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('token', token);
      localStorage.setItem('role', payload.role);
      nav('/boxes');
    } catch (e) {
      setErr('❌ Login fehlgeschlagen');
    }
  };

  return (
    <div className="p-6 max-w-sm">
      <h2 className="text-xl font-bold mb-4">🔐 Login</h2>
      <input
        className="border p-2 w-full mb-2"
        placeholder="Benutzername"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button
        onClick={login}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Einloggen
      </button>
      {err && <p className="text-red-600 mt-2">{err}</p>}
    </div>
  );
}
