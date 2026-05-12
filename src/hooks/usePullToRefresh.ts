import { useEffect, useRef, useState } from "react";

interface Options {
  onRefresh: () => Promise<void> | void;
  /** Pull distance (px) required to trigger refresh */
  threshold?: number;
  /** Disable when false */
  enabled?: boolean;
}

/**
 * Native-feel pull-to-refresh for mobile WebViews (Capacitor / iOS Safari / Android).
 * Attach the returned ref to the scrollable container element. Refresh triggers
 * only when the container is scrolled to the top and the user pulls down past
 * `threshold`.
 */
export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  threshold = 70,
  enabled = true,
}: Options) {
  const ref = useRef<T | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const handleStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (!atTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };

    const handleMove = (e: TouchEvent) => {
      if (refreshing || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (pulling.current) {
          pulling.current = false;
          setPullDistance(0);
        }
        return;
      }
      if (!atTop()) return;
      // Resistance curve so it doesn't drag 1:1
      const resisted = Math.min(120, dy * 0.45);
      pulling.current = true;
      setPullDistance(resisted);
    };

    const handleEnd = async () => {
      const shouldRefresh = pulling.current && pullDistance >= threshold;
      pulling.current = false;
      startY.current = null;
      if (shouldRefresh) {
        setRefreshing(true);
        setPullDistance(60);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: true });
    el.addEventListener("touchend", handleEnd, { passive: true });
    el.addEventListener("touchcancel", handleEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleEnd);
    };
  }, [onRefresh, threshold, enabled, pullDistance, refreshing]);

  return { ref, pullDistance, refreshing };
}