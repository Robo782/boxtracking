// client/src/utils/api.js
import { getAuth } from "./auth";
const BASE = "/api";

async function request(method, url, body, opts = {}) {
  const { token } = getAuth();
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchOpts = { method, headers, signal: opts.signal };
  if (body !== undefined) fetchOpts.body = JSON.stringify(body);

  const res = await fetch(BASE + url, fetchOpts);

  if (!res.ok) {
    let msg = "Unbekannter Fehler";
    try {
      const j = await res.json();
      msg = j.message || j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export default {
  get: (url, opts) => request("GET", url, undefined, opts),
  post: (url, body, opts) => request("POST", url, body, opts),
  patch: (url, body, opts) => request("PATCH", url, body, opts),
  del: (url, opts) => request("DELETE", url, undefined, opts),
};
