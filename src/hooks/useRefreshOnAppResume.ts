import { useEffect, useRef } from "react";

/**
 * Fires `onResume` whenever the app/tab regains visibility or window focus.
 * Useful for refreshing data on the home screen after the user backgrounds
 * the installed app and returns to it (Capacitor / mobile browsers).
 *
 * - Debounced so a single resume doesn't fire twice (visibilitychange +
 *   focus often fire back-to-back on mobile).
 * - Skips the very first mount; the page's own initial fetch handles that.
 */
export function useRefreshOnAppResume(onResume: () => void, debounceMs = 800) {
  const cbRef = useRef(onResume);
  cbRef.current = onResume;

  useEffect(() => {
    let lastFired = 0;
    const trigger = () => {
      const now = Date.now();
      if (now - lastFired < debounceMs) return;
      lastFired = now;
      cbRef.current?.();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") trigger();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", trigger);

    // Capacitor: app comes back to foreground
    let capCleanup: (() => void) | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const sub = await App.addListener("appStateChange", (state) => {
          if (state.isActive) trigger();
        });
        capCleanup = () => sub.remove();
      } catch {
        // @capacitor/app not available (web build) — ignore
      }
    })();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", trigger);
      capCleanup?.();
    };
  }, [debounceMs]);
}