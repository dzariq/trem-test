import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const SM_BREAKPOINT = 640;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Returns true if viewport width is less than 640px (sm breakpoint).
 * Used for responsive modal/sheet switching.
 *
 * Uses useSyncExternalStore pattern to avoid hydration mismatches
 * and ensure consistent values during SSR/CSR.
 */
export function useIsSmallScreen() {
  const subscribe = React.useCallback((callback: () => void) => {
    const mql = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", callback);
    window.addEventListener("resize", callback);
    return () => {
      mql.removeEventListener("change", callback);
      window.removeEventListener("resize", callback);
    };
  }, []);

  const getSnapshot = React.useCallback(() => {
    return window.innerWidth < SM_BREAKPOINT;
  }, []);

  const getServerSnapshot = React.useCallback(() => {
    // Default to mobile view for SSR (safer default for mobile-first app)
    return true;
  }, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
