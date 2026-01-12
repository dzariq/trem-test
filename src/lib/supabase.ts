import { createClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if we're running in a Capacitor native environment
const isNativeApp = typeof (window as unknown as { Capacitor?: unknown }).Capacitor !== 'undefined';

// Use Capacitor Preferences for native apps, localStorage for web
const storage = isNativeApp
  ? {
      getItem: async (key: string) => (await Preferences.get({ key })).value ?? null,
      setItem: async (key: string, value: string) => { await Preferences.set({ key, value }); },
      removeItem: async (key: string) => { await Preferences.remove({ key }); },
    }
  : {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNativeApp, // Enable for web, disable for mobile
  },
});

