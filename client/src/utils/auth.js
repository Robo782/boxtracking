/**
 * Holt JWT + Rolle aus localStorage und prüft, ob es gültig ist.
 * Ungültige oder leere Tokens werden sofort aus dem Storage entfernt.
 */
export function getAuth() {
  let token = localStorage.getItem("token");

  // leere oder kaputte Einträge bereinigen
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    return { token: null, role: null, valid: false };
  }

  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    const valid = payload.exp ? payload.exp * 1000 > Date.now() : true;

    if (!valid) localStorage.removeItem("token");
    return { token, role: payload.role, valid };
  } catch (err) {
    console.warn("[auth] Ungültiges JWT entfernt", err);
    localStorage.removeItem("token");
    return { token: null, role: null, valid: false };
  }
}
