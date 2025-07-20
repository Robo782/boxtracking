/**
 * Zentraler Fetch-Wrapper mit Auto-Logout bei 401/403.
 * Verwende in allen Pages statt fetch(): api(url, opts)
 */
export async function api(url, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 401 || res.status === 403) {
    // Session invalid → alles löschen & zum Login
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  return res;
}
