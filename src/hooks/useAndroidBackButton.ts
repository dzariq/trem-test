import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

/**
 * Wire the Android hardware back button to React Router history.
 * - On a non-root route: navigate(-1)
 * - On root (/, /portal, /parent, /teacher, /login): minimize the app
 *   instead of exiting, matching standard Android UX.
 * No-op on iOS and web.
 */
const ROOT_ROUTES = new Set(["/", "/login", "/portal", "/parent", "/teacher"]);

export function useAndroidBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== "android") return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          const isRoot = ROOT_ROUTES.has(location.pathname);
          if (isRoot || !canGoBack) {
            App.minimizeApp().catch(() => undefined);
          } else {
            navigate(-1);
          }
        });
        if (cancelled) {
          handle.remove();
        } else {
          cleanup = () => handle.remove();
        }
      } catch (err) {
        console.error("[useAndroidBackButton] init failed", err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate, location.pathname]);
}