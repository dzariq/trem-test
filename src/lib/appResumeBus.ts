/**
 * Global app-resume bus.
 *
 * Single set of listeners (visibilitychange / window.focus / Capacitor
 * appStateChange) fans out to any number of subscribers. Subscribers only
 * fire when the app has been backgrounded for at least `minAwayMs`, so
 * quick tab-switches don't spam refetches.
 */

type Listener = () => void;

const MIN_AWAY_MS = 30_000; // 30s gate before we consider it a real resume
const DEBOUNCE_MS = 800;

const listeners = new Set<Listener>();
let installed = false;
let lastHiddenAt: number | null = null;
let lastFiredAt = 0;
let capCleanup: (() => void) | null = null;

function fire() {
  const now = Date.now();
  if (now - lastFiredAt < DEBOUNCE_MS) return;
  lastFiredAt = now;
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // listeners must not throw
    }
  });
}

function maybeFire() {
  const awayFor = lastHiddenAt ? Date.now() - lastHiddenAt : Infinity;
  if (awayFor < MIN_AWAY_MS) return;
  fire();
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      lastHiddenAt = Date.now();
    } else if (document.visibilityState === "visible") {
      maybeFire();
    }
  };
  const onFocus = () => maybeFire();
  const onBlur = () => {
    if (lastHiddenAt == null) lastHiddenAt = Date.now();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);

  (async () => {
    try {
      const { App } = await import("@capacitor/app");
      const sub = await App.addListener("appStateChange", (state) => {
        if (state.isActive) {
          maybeFire();
        } else {
          lastHiddenAt = Date.now();
        }
      });
      capCleanup = () => sub.remove();
    } catch {
      // @capacitor/app not available — ignore
    }
  })();

  // Note: we intentionally never tear these down; bus lives for app lifetime.
  void capCleanup;
}

export function subscribeAppResume(cb: Listener): () => void {
  install();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Force-fire (for pull-to-refresh or manual triggers). */
export function emitAppResume() {
  fire();
}