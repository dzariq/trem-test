import { useEffect, useRef } from "react";
import { subscribeAppResume } from "@/lib/appResumeBus";

/**
 * Fires `onResume` whenever the app/tab returns from being backgrounded
 * for at least ~30s (Capacitor / mobile browsers / desktop tab focus).
 *
 * Backed by a single global bus (`appResumeBus`) so listeners are cheap
 * and we never double-attach native handlers.
 */
export function useRefreshOnAppResume(onResume: () => void) {
  const cbRef = useRef(onResume);
  cbRef.current = onResume;

  useEffect(() => {
    return subscribeAppResume(() => cbRef.current?.());
  }, []);
}

/** Same as `useRefreshOnAppResume` — semantic alias for use inside data hooks. */
export function useRefetchOnResume(refetch: () => void) {
  useRefreshOnAppResume(refetch);
}