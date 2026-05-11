import { Capacitor } from "@capacitor/core";

/**
 * Open an external URL safely on web and native (Capacitor).
 * On native, uses the in-app system browser (SFSafariViewController / Custom Tabs)
 * so the user can return to the app cleanly. On web, opens a new tab.
 */
export async function openExternal(url: string): Promise<void> {
  if (!url) return;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch (err) {
      console.error("[openExternal] native browser failed", err);
    }
  }
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    window.location.href = url;
  }
}

/**
 * Place a tel: call. On platforms without telephony (iPad, web desktop) the
 * call silently no-ops instead of producing a "page can't be loaded" error.
 */
export function callTel(phone: string): void {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned) return;
  // On native iPad / non-phone devices, tel: triggers a system error sheet.
  // window.location works on iPhone and Android; do nothing on web desktop.
  if (typeof window === "undefined") return;
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : "",
  );
  if (Capacitor.isNativePlatform() || isMobileUA) {
    window.location.href = `tel:${cleaned}`;
  }
}