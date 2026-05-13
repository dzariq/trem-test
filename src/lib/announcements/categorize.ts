import type { Announcement } from "@/data/announcements";

export function categorizeAnnouncements(announcements: Announcement[]) {
  const featured = announcements.find((a) => a.is_featured) ?? null;
  const featuredTitle = featured?.title?.trim().toLowerCase() ?? null;
  const pinned = announcements
    .filter((a) => a.is_pinned && a.id !== featured?.id && (!featuredTitle || a.title?.trim().toLowerCase() !== featuredTitle))
    .sort((a, b) => {
      const aTime = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
      const bTime = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);
  const pinnedIds = new Set([featured?.id, ...pinned.map((p) => p.id)]);
  const usedTitles = new Set<string>();
  if (featuredTitle) usedTitles.add(featuredTitle);
  pinned.forEach((p) => {
    const t = p.title?.trim().toLowerCase();
    if (t) usedTitles.add(t);
  });
  const regular = announcements.filter((a) => {
    if (pinnedIds.has(a.id)) return false;
    const t = a.title?.trim().toLowerCase();
    if (t && usedTitles.has(t)) return false;
    return true;
  }).sort((a, b) => {
    // Unread first, then newest first
    const aUnread = a.is_read ? 1 : 0;
    const bUnread = b.is_read ? 1 : 0;
    if (aUnread !== bUnread) return aUnread - bUnread;
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  return { featured, pinned, regular };
}
