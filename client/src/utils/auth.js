// client/src/utils/auth.js

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json || {};
  } catch {
    return {};
  }
}

export function storeAuth(token) {
  try {
    localStorage.setItem("token", token);
    sessionStorage.setItem("token", token);
  } catch {}
  const p = decodeJwt(token);
  const state = { token, role: p.role || null, username: p.username || null, valid: !!p.exp };
  // Für reaktives Navbar-Update
  try { window.dispatchEvent(new StorageEvent("storage", { key: "token" })); } catch {}
  return state;
}

export function getAuth() {
  let token = null;
  try { token = localStorage.getItem("token") || sessionStorage.getItem("token"); } catch {}
  if (!token) return { token: null, role: null, username: null, valid: false };
  const p = decodeJwt(token);
  return { token, role: p.role || null, username: p.username || null, valid: !!p.exp };
}

export function clearAuth() {
  try { localStorage.removeItem("token"); } catch {}
  try { sessionStorage.removeItem("token"); } catch {}
  try { window.dispatchEvent(new StorageEvent("storage", { key: "token" })); } catch {}
}
