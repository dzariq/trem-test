import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isNativeApp = Capacitor.isNativePlatform();

const shouldLogDebug =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    window.localStorage?.getItem("DEBUG_MODE") === "1");

let didLogDebug = false;
if (shouldLogDebug && !didLogDebug) {
  const keySuffix = typeof supabaseAnonKey === "string" ? supabaseAnonKey.slice(-6) : "none";
  console.log("[supabase] URL:", supabaseUrl || "undefined");
  console.log("[supabase] Key (last 6):", keySuffix);
  didLogDebug = true;
}

// Use Capacitor Preferences for native apps; default storage (localStorage) for web
const storage = isNativeApp
  ? {
      getItem: async (key: string) => (await Preferences.get({ key })).value ?? null,
      setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string) => {
        await Preferences.remove({ key });
      },
    }
  : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

