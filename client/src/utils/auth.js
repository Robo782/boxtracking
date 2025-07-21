/**
 * Lies JWT + Rolle aus dem localStorage
 * und prüfe, ob das Token noch gültig ist.
 */
export function getAuth() {
  const token = localStorage.getItem("token");
  if (!token) return { token: null, role: null, valid: false };

  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    const valid = payload.exp ? payload.exp * 1000 > Date.now() : true;
    return { token, role: payload.role, valid };
  } catch (err) {
    console.warn("[auth] Ungültiges JWT – lösche es", err);
    return { token: null, role: null, valid: false };
  }
}
