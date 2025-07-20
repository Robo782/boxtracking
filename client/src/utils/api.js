// zentraler Fetch-Wrapper – immer JWT mitsenden & JSON automatisch parsen
export async function api(
  url,
  { method = "GET", headers = {}, body, ...rest } = {}
) {
  const token = localStorage.getItem("token");
  const hdrs  = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body   ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  const res = await fetch(url, { method, headers: hdrs, body, ...rest });

  // 204 (No Content) = OK aber ohne Payload
  if (res.status === 204) return null;

  // Lies die Antwort (text oder json – je nach Header)
  const data = res.headers
    .get("content-type")?.includes("application/json")
      ? await res.json()
      : await res.text();

  if (!res.ok) throw new Error(data?.message || res.statusText);
  return data;
}

// kleine Komfort-Helfer
export const apiGet    = (u)           => api(u);
export const apiPost   = (u, b)        => api(u, { method: "POST", body: JSON.stringify(b) });
export const apiPut    = (u, b)        => api(u, { method: "PUT",  body: JSON.stringify(b) });
export const apiDelete = (u)           => api(u, { method: "DELETE" });
