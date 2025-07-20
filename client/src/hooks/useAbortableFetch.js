import { useEffect, useRef } from "react";

/** run = signal => fetch(url,{ signal }) – wird beim Unmount abgebrochen */
export default function useAbortableFetch(run) {
  const ctl = useRef(null);

  useEffect(() => {
    ctl.current = new AbortController();
    run(ctl.current.signal);
    return () => ctl.current.abort();
  }, [run]);
}
