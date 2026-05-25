const STORAGE_KEY = "exam_publish_viewed";

type ViewedMap = Record<string, string>; // academic_period_id -> publication_id

function read(): ViewedMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ViewedMap;
  } catch {
    return {};
  }
}

function write(map: ViewedMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

/** Parse `exam_publish:<publication_id>` from a notification source_key. */
export function parsePublicationIdFromSourceKey(sourceKey: string | null | undefined): string | null {
  if (!sourceKey) return null;
  const m = sourceKey.match(/^exam_publish:([^:]+)$/);
  return m ? m[1] : null;
}

export function getViewedPublicationId(academicPeriodId: string): string | null {
  return read()[academicPeriodId] ?? null;
}

export function markPublicationViewed(academicPeriodId: string, publicationId: string) {
  const map = read();
  map[academicPeriodId] = publicationId;
  write(map);
}

/**
 * Returns true when the user has previously viewed a publication for this
 * academic period AND the incoming publication id is different (i.e. a
 * re-publish has happened since their last view).
 */
export function isRepublishUnseen(academicPeriodId: string, publicationId: string): boolean {
  const seen = getViewedPublicationId(academicPeriodId);
  return Boolean(seen) && seen !== publicationId;
}