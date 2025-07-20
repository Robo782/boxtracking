import { useEffect, useState, useRef } from "react";

export default function useFetch(url, opts = {}) {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoad ] = useState(true);

  const abortRef = useRef(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(url, { signal: ctrl.signal, ...opts })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setData)
      .catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoad(false));

    return () => ctrl.abort();
  }, [url]);

  return { data, error, loading };
}
