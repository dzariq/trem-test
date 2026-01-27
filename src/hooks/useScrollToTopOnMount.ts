import { useEffect } from "react";

/**
 * Scrolls the primary app scroll container to the top on mount.
 * Falls back to the window/document scroll position if no container is found.
 */
export function useScrollToTopOnMount() {
  useEffect(() => {
    const scrollEl = document.querySelector('[data-app-scroll="true"]') as HTMLElement | null;

    const scrollTarget = scrollEl ?? document.scrollingElement ?? null;

    const doScroll = () => {
      if (scrollTarget && typeof scrollTarget.scrollTo === "function") {
        scrollTarget.scrollTo({ top: 0, left: 0, behavior: "auto" });
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const raf = requestAnimationFrame(doScroll);
    const timeout = window.setTimeout(doScroll, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, []);
}
