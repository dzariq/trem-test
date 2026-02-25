import type { Announcement } from "@/data/announcements";

export function categorizeAnnouncements(announcements: Announcement[]) {
  const featured = announcements.find((a) => a.is_featured) ?? null;
  const pinned = announcements
    .filter((a) => a.is_pinned && a.id !== featured?.id)
    .sort((a, b) => {
      const aTime = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
      const bTime = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);
  const pinnedIds = new Set([featured?.id, ...pinned.map((p) => p.id)]);
  const regular = announcements.filter((a) => !pinnedIds.has(a.id));
  return { featured, pinned, regular };
}
