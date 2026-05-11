import { Capacitor } from "@capacitor/core";

/**
 * Mirror selected localStorage keys to @capacitor/preferences on native.
 * iOS WebView storage can be evicted under memory pressure; Preferences
 * (NSUserDefaults / SharedPreferences) is durable. On web this is a no-op.
 *
 * Usage: call `setMirrored(key, value)` instead of localStorage.setItem,
 * and `removeMirrored(key)` instead of localStorage.removeItem.
 * On app boot, call `restoreMirrored([...keys])` once before reading from
 * localStorage so any evicted values are rehydrated.
 */

const isNative = () => Capacitor.isNativePlatform();

let prefsModule: typeof import("@capacitor/preferences") | null = null;
const getPrefs = async () => {
  if (!prefsModule) prefsModule = await import("@capacitor/preferences");
  return prefsModule.Preferences;
};

export async function setMirrored(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch { /* quota */ }
  if (!isNative()) return;
  try {
    const Preferences = await getPrefs();
    await Preferences.set({ key, value });
  } catch (err) {
    console.error("[storage] set failed", key, err);
  }
}

export async function removeMirrored(key: string): Promise<void> {
  try { localStorage.removeItem(key); } catch { /* noop */ }
  if (!isNative()) return;
  try {
    const Preferences = await getPrefs();
    await Preferences.remove({ key });
  } catch (err) {
    console.error("[storage] remove failed", key, err);
  }
}

export async function restoreMirrored(keys: string[]): Promise<void> {
  if (!isNative()) return;
  try {
    const Preferences = await getPrefs();
    for (const key of keys) {
      if (localStorage.getItem(key) !== null) continue;
      const { value } = await Preferences.get({ key });
      if (value != null) {
        try { localStorage.setItem(key, value); } catch { /* noop */ }
      }
    }
  } catch (err) {
    console.error("[storage] restore failed", err);
  }
}