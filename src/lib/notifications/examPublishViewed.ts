const STORAGE_KEY = "exam_publish_viewed";

function readViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeViewed(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-200)));
  } catch {}
}

/** Parse `exam_publish:<publication_id>` from a notification source_key. */
export function parsePublicationIdFromSourceKey(sourceKey: string | null | undefined): string | null {
  if (!sourceKey) return null;
  const m = sourceKey.match(/^exam_publish:([^:]+)$/);
  return m ? m[1] : null;
}

export function getViewedPublicationIds(): Set<string> {
  return new Set(readViewed());
}

export function markPublicationViewed(publicationId: string) {
  const ids = readViewed();
  if (!ids.includes(publicationId)) {
    ids.push(publicationId);
    writeViewed(ids);
  }
}