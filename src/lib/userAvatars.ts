import { supabase } from "@/lib/supabase";
import { compressImageFile } from "@/lib/studentAvatars";

const BUCKET = "user-avatars";
const URL_CACHE_KEY = "user_avatar_urls_v1";

type Map = Record<string, string | null>;

function read(): Map {
  try {
    const raw = localStorage.getItem(URL_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Map) : {};
  } catch {
    return {};
  }
}
function write(m: Map) {
  try {
    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
}

export function getCachedUserAvatar(userId: string): string | null {
  return read()[userId] ?? null;
}

export function setCachedUserAvatar(userId: string, url: string | null) {
  const m = read();
  if (url) m[userId] = url;
  else delete m[userId];
  write(m);
  window.dispatchEvent(
    new CustomEvent("user-photo-changed", { detail: { userId, photoUrl: url } })
  );
}

export async function resolveUserAvatar(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list(userId, {
      limit: 10,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (error || !data || data.length === 0) {
      setCachedUserAvatar(userId, null);
      return null;
    }
    const file = data.find((f) => f.name.startsWith("avatar"));
    if (!file) {
      setCachedUserAvatar(userId, null);
      return null;
    }
    const path = `${userId}/${file.name}`;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const updatedAt =
      (file as { updated_at?: string }).updated_at ?? Date.now().toString();
    const url = `${urlData.publicUrl}?v=${encodeURIComponent(updatedAt)}`;
    setCachedUserAvatar(userId, url);
    return url;
  } catch {
    return getCachedUserAvatar(userId);
  }
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const compressed = await compressImageFile(file, 512, 0.85).catch(() => file);
  const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { data: existing } = await supabase.storage.from(BUCKET).list(userId, { limit: 20 });
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((f) => f.name.startsWith("avatar"))
      .map((f) => `${userId}/${f.name}`);
    if (toRemove.length > 0) {
      await supabase.storage.from(BUCKET).remove(toRemove);
    }
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "3600",
    upsert: true,
    contentType: compressed.type || "image/jpeg",
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = `${urlData.publicUrl}?v=${Date.now()}`;
  setCachedUserAvatar(userId, url);
  return url;
}

export async function deleteUserAvatar(userId: string): Promise<void> {
  const { data: existing } = await supabase.storage.from(BUCKET).list(userId, { limit: 20 });
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((f) => f.name.startsWith("avatar"))
      .map((f) => `${userId}/${f.name}`);
    if (toRemove.length > 0) {
      await supabase.storage.from(BUCKET).remove(toRemove);
    }
  }
  setCachedUserAvatar(userId, null);
}