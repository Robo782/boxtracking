/**
 * api() – fetch-Wrapper mit Auto-Logout bei 401/403
 * usage: const res = await api("/api/boxes");
 */
export async function api(url, opts = {}) {
  const token   = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 401 || res.status === 403) {
    // Token ungültig → zurück zum Login + Storage leeren
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return res;
}
