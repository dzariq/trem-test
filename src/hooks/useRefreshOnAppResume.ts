import { useEffect, useRef } from "react";
import { subscribeAppResume } from "@/lib/appResumeBus";
import { useState } from "react";

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

/**
 * Returns a number that increments on every app-resume event.
 * Drop it into a `useEffect` dependency array to make any effect re-run
 * when the app comes back from the background.
 */
export function useResumeTick(): number {
  const [tick, setTick] = useState(0);
  useRefreshOnAppResume(() => setTick((t) => t + 1));
  return tick;
}