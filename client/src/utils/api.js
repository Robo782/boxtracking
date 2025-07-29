// universeller Fetch-Wrapper   (GET / POST / PATCH / DELETE)
const BASE = "/api";               // bei Bedarf anpassen

async function request(method, url, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + url, opts);

  if (!res.ok) {
    // Fehlertext (z.B. { message:"…" }) an den Aufrufer durchreichen
    let msg = "Unbekannter Fehler";
    try { msg = (await res.json()).message; } catch {}
    throw new Error(msg);
  }
  // 204 No Content → nichts zurückgeben
  return res.status === 204 ? null : res.json();
}

export default {
  get   : (url)        => request("GET",    url),
  post  : (url, body)  => request("POST",   url, body),
  patch : (url, body)  => request("PATCH",  url, body),   //  ← NEU
  del   : (url)        => request("DELETE", url)
};
