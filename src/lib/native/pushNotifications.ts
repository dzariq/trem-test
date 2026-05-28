import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

type PushPlatform = "android" | "ios" | "unknown";

function getPlatform(): PushPlatform {
  const p = Capacitor.getPlatform();
  if (p === "android" || p === "ios") return p;
  return "unknown";
}

async function ensurePermissions() {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    if (req.receive !== "granted") {
      throw new Error("Push permission not granted");
    }
  }
}

/**
 * Register device for FCM/APNs and upsert the resulting token to Supabase.
 *
 * Requires a Supabase table:
 *   public.user_push_tokens(user_id uuid, token text, platform text, updated_at timestamptz)
 */
export async function registerPushAndSyncToken(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  await ensurePermissions();

  // Register with FCM/APNs (triggers "registration" event with token).
  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    const t = token?.value;
    if (!t) return;

    const { error } = await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        token: t,
        platform: getPlatform(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

    if (error) {
      // Non-fatal: app still works without push.
      console.warn("[push] failed to upsert token", error);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.warn("[push] registration error", err);
  });
}

export async function unregisterPushTokenForUser(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  // Best-effort: delete all tokens for user on sign out.
  const { error } = await supabase.from("user_push_tokens").delete().eq("user_id", userId);
  if (error) {
    console.warn("[push] failed to delete tokens on sign out", error);
  }
}

