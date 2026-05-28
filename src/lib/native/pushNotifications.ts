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

    // Subscribe this device token to the user's FCM topics
    // (from user_profiles.topic_subscribed).
    try {
      const { error: fnError } = await supabase.functions.invoke(
        "fcm-subscribe-topics",
        { body: { token: t } },
      );
      if (fnError) console.warn("[push] topic subscribe failed", fnError);
    } catch (e) {
      console.warn("[push] topic subscribe threw", e);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.warn("[push] registration error", err);
  });
}

export async function unregisterPushTokenForUser(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  // 1) Fetch this user's device tokens so we can pass them to the
  //    unsubscribe edge function (the JWT is still valid at this point).
  let tokens: string[] = [];
  try {
    const { data, error } = await supabase
      .from("user_push_tokens")
      .select("token")
      .eq("user_id", userId);
    if (error) console.warn("[push] fetch tokens for unsubscribe failed", error);
    tokens = (data ?? []).map((r: { token: string }) => r.token).filter(Boolean);
  } catch (e) {
    console.warn("[push] fetch tokens for unsubscribe threw", e);
  }

  // 2) Unsubscribe from all FCM topics in user_profiles.topic_subscribed.
  try {
    const { error: fnError } = await supabase.functions.invoke(
      "fcm-unsubscribe-topics",
      { body: { tokens } },
    );
    if (fnError) console.warn("[push] topic unsubscribe failed", fnError);
  } catch (e) {
    console.warn("[push] topic unsubscribe threw", e);
  }

  // 3) Delete tokens for this user.
  const { error } = await supabase.from("user_push_tokens").delete().eq("user_id", userId);
  if (error) {
    console.warn("[push] failed to delete tokens on sign out", error);
  }
}

