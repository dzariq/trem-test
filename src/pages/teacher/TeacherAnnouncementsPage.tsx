import { useEffect, useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { useCampus } from "@/contexts/CampusContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Pin } from "lucide-react";
import { listAnnouncements, markAnnouncementRead, type Announcement } from "@/data/announcements";
import { AnnouncementDrawer } from "@/components/AnnouncementDrawer";
import { categorizeAnnouncements } from "@/lib/announcements/categorize";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";

export default function TeacherAnnouncementsPage() {
  const { activeCampus } = useCampus();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAnnouncements({ limit: 50, campusCode: activeCampus });
        if (isMounted) setAnnouncements(data);
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load announcements.";
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAnnouncements();
    return () => { isMounted = false; };
  }, [activeCampus]);

  const { featured, pinned, regular } = categorizeAnnouncements(announcements);

  const unreadFeatured = featured && !featured.is_read ? featured : null;
  const readFeatured = featured && featured.is_read ? featured : null;
  const unreadPinned = pinned.filter(a => !a.is_read);
  const readPinned = pinned.filter(a => a.is_read);
  const unreadRegular = regular.filter(a => !a.is_read);
  const readRegular = regular.filter(a => a.is_read);
  const earlier = [
    ...(readFeatured ? [{ ...readFeatured, _v: "featured" as const }] : []),
    ...readPinned.map(a => ({ ...a, _v: "pinned" as const })),
    ...readRegular.map(a => ({ ...a, _v: "regular" as const })),
  ];

  const drawerList = [
    ...(featured ? [featured] : []),
    ...pinned,
    ...regular,
  ];

  const handleAnnouncementClick = (announcement: Announcement) => {
    const idx = drawerList.findIndex(a => a.id === announcement.id);
    setCurrentAnnouncementIndex(idx >= 0 ? idx : 0);
    setDrawerOpen(true);
    void markAnnouncementRead(announcement.id).catch(() => {});
    setAnnouncements(prev =>
      prev.map(item => (item.id === announcement.id ? { ...item, is_read: true } : item))
    );
  };

  const handleAnnouncementUpdated = (id: number | string, updates: Partial<Announcement>) => {
    setAnnouncements(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <TeacherAppLayout>
      <AppHeader title="Announcements" showBack />

      <section className="px-4 pt-4 pb-6 space-y-4">
        {loading && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Loading announcements...
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {!loading && !error && announcements.length === 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No announcements available.
            </CardContent>
          </Card>
        )}

        {!loading && !error && announcements.length > 0 && (
          <>
            {unreadFeatured && (
              <AnnouncementCard
                announcement={unreadFeatured}
                variant="featured"
                onClick={() => handleAnnouncementClick(unreadFeatured)}
              />
            )}

            {unreadPinned.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Pin className="h-3 w-3 rotate-45" />
                  Pinned
                </div>
                {unreadPinned.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    variant="pinned"
                    onClick={() => handleAnnouncementClick(a)}
                  />
                ))}
              </div>
            )}

            {unreadRegular.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  New
                </div>
                {unreadRegular.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    variant="regular"
                    onClick={() => handleAnnouncementClick(a)}
                  />
                ))}
              </div>
            )}

            {earlier.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Earlier
                </div>
                {earlier.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    variant={a._v}
                    onClick={() => handleAnnouncementClick(a)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <AnnouncementDrawer
        announcements={drawerList}
        currentIndex={currentAnnouncementIndex}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        onNavigate={setCurrentAnnouncementIndex}
        onAnnouncementUpdated={handleAnnouncementUpdated}
      />
    </TeacherAppLayout>
  );
}
