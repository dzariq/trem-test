import { supabase } from "@/integrations/supabase/client";

const BUCKET = "student-avatars";
const URL_CACHE_KEY = "student_avatar_urls_v1";

export type StudentAvatarMap = Record<string, string | null>;

function readUrlCache(): StudentAvatarMap {
  try {
    const raw = localStorage.getItem(URL_CACHE_KEY);
    return raw ? (JSON.parse(raw) as StudentAvatarMap) : {};
  } catch {
    return {};
  }
}

function writeUrlCache(map: StudentAvatarMap) {
  try {
    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getCachedAvatarUrl(studentId: string): string | null {
  const map = readUrlCache();
  return map[studentId] ?? null;
}

export function setCachedAvatarUrl(studentId: string, url: string | null) {
  const map = readUrlCache();
  if (url) map[studentId] = url;
  else delete map[studentId];
  writeUrlCache(map);
  window.dispatchEvent(
    new CustomEvent("student-photo-changed", {
      detail: { studentId, photoUrl: url },
    })
  );
}

/**
 * Resolve avatars for a list of student ids by listing the bucket folder.
 * Files are stored at `${studentId}/avatar.<ext>`. Returns map of studentId -> public URL (cache-busted).
 */
export async function resolveStudentAvatars(studentIds: string[]): Promise<StudentAvatarMap> {
  const result: StudentAvatarMap = { ...readUrlCache() };

  await Promise.all(
    studentIds.map(async (id) => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).list(id, {
          limit: 10,
          sortBy: { column: "updated_at", order: "desc" },
        });
        if (error || !data || data.length === 0) {
          if (result[id]) {
            delete result[id];
          }
          return;
        }
        const file = data.find((f) => f.name.startsWith("avatar"));
        if (!file) {
          delete result[id];
          return;
        }
        const path = `${id}/${file.name}`;
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const updatedAt = (file as { updated_at?: string }).updated_at ?? Date.now().toString();
        result[id] = `${urlData.publicUrl}?v=${encodeURIComponent(updatedAt)}`;
      } catch {
        // ignore individual failures
      }
    })
  );

  writeUrlCache(result);
  return result;
}

export async function uploadStudentAvatar(studentId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${studentId}/avatar.${ext}`;

  // Remove any pre-existing avatar files for this student so we don't accumulate
  const { data: existing } = await supabase.storage.from(BUCKET).list(studentId, { limit: 20 });
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((f) => f.name.startsWith("avatar"))
      .map((f) => `${studentId}/${f.name}`);
    if (toRemove.length > 0) {
      await supabase.storage.from(BUCKET).remove(toRemove);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = `${urlData.publicUrl}?v=${Date.now()}`;
  setCachedAvatarUrl(studentId, url);
  return url;
}

export async function deleteStudentAvatar(studentId: string): Promise<void> {
  const { data: existing } = await supabase.storage.from(BUCKET).list(studentId, { limit: 20 });
  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((f) => f.name.startsWith("avatar"))
      .map((f) => `${studentId}/${f.name}`);
    if (toRemove.length > 0) {
      await supabase.storage.from(BUCKET).remove(toRemove);
    }
  }
  setCachedAvatarUrl(studentId, null);
}

/**
 * Compress an image File down to a JPEG blob within MAX_DIM and quality.
 */
export function compressImageFile(file: File, maxDim = 512, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
