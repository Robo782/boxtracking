// client/src/utils/api.js
import { getAuth } from "./auth";

const BASE = "/api";

function safeToken() {
  // 1) Versuch: über dein getAuth()
  try {
    const a = typeof getAuth === "function" ? getAuth() : null;
    if (a && a.token) return a.token;
  } catch {}
  // 2) Fallback: direkt aus Storage (falls Login anders speichert)
  try {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (t) return t;
  } catch {}
  return null;
}

async function request(method, url, body, opts = {}) {
  const token = safeToken();
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchOpts = { method, headers, signal: opts.signal };
  if (body !== undefined) fetchOpts.body = JSON.stringify(body);

  const res = await fetch(BASE + url, fetchOpts);

  // Einmalig JSON lesen (falls vorhanden)
  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || "Unbekannter Fehler";
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export default {
  get   : (url, opts)       => request("GET",    url, undefined, opts),
  post  : (url, body, opts) => request("POST",   url, body,      opts),
  patch : (url, body, opts) => request("PATCH",  url, body,      opts),
  del   : (url, opts)       => request("DELETE", url, undefined, opts),
};
