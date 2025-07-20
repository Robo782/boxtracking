// utils/api.js   (vollständige Datei)
function request(path, opts) {
  const token = localStorage.getItem("token");
  return fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opts?.headers,
    },
    ...opts,
  }).then(async r => {
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      throw new Error(`${r.status} ${msg}`);
    }
    return r.status === 204 ? null : r.json();
  });
}

export default {
  get:  (path)            => request(path),
  post: (path, data)      => request(path, { method: "POST", body: JSON.stringify(data) }),
  put:  (path, data)      => request(path, { method: "PUT",  body: JSON.stringify(data) }),
  del:  (path)            => request(path, { method: "DELETE" }),
};
