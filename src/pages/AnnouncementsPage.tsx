import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Megaphone, ChevronLeft, Pin, MailOpen, Flag, ArrowDownUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnnouncementDrawer } from "@/components/AnnouncementDrawer";
import { listAnnouncements, markAnnouncementRead, type Announcement } from "@/data/announcements";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { categorizeAnnouncements } from "@/lib/announcements/categorize";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PriorityFilter = "all" | "high" | "medium" | "low";
type SortOrder = "newest" | "oldest";

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const {
    selectedStudentId,
    selectedStudent,
  } = useStudentSelection();
  const parentCampusCode = selectedStudent?.campus_code ?? null;

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAnnouncements({ limit: 50, studentId: selectedStudentId, campusCode: parentCampusCode });
        if (isMounted) setAnnouncements(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load announcements.";
        if (isMounted) { setError(message); setAnnouncements([]); }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAnnouncements();
    return () => { isMounted = false; };
  }, [selectedStudentId, parentCampusCode]);

  const filteredAnnouncements = announcements
    .filter(a => {
      const matchesPriority =
        priorityFilter === "all" ||
        (a.priority ?? "").toString().toLowerCase() === priorityFilter;
      const matchesUnread = !unreadOnly || !a.is_read;
      return matchesPriority && matchesUnread;
    })
    .sort((a, b) => {
      const ta = new Date(a.date).getTime() || 0;
      const tb = new Date(b.date).getTime() || 0;
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

  const { featured, pinned, regular } = categorizeAnnouncements(filteredAnnouncements);

  // Group strictly by read state so featured/pinned that are already read
  // collapse into the compact "Earlier" list instead of dominating the page.
  const unreadFeatured = featured && !featured.is_read ? featured : null;
  const readFeatured = featured && featured.is_read ? featured : null;
  const unreadPinned = pinned.filter(a => !a.is_read);
  const readPinned = pinned.filter(a => a.is_read);
  const unreadRegular = regular.filter(a => !a.is_read);
  const readRegular = regular.filter(a => a.is_read);
  const earlier = [...(readFeatured ? [{ ...readFeatured, _v: "featured" as const }] : []),
    ...readPinned.map(a => ({ ...a, _v: "pinned" as const })),
    ...readRegular.map(a => ({ ...a, _v: "regular" as const }))];

  // Build a flat list for the drawer navigation from the FULL (unfiltered) list
  // so prev/next navigation isn't broken when items get marked read while
  // the "Unread only" filter is active.
  const drawerBase = categorizeAnnouncements(announcements);
  const drawerList = [
    ...(drawerBase.featured ? [drawerBase.featured] : []),
    ...drawerBase.pinned,
    ...drawerBase.regular,
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
    <AppLayout>
      <AppHeader
        showChildSelector
        leftContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
          </div>
        }
      />

      <section className="px-4 py-4">
        {/* Filters */}
        <div className="space-y-3 mb-4">
          {/* Unread + Priority + Sort in one row */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5 shrink-0"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              <MailOpen className="h-4 w-4" />
              Unread
            </Button>
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}
            >
              <SelectTrigger className="h-9 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Flag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as SortOrder)}
            >
              <SelectTrigger className="h-9 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {/* Featured (only when unread) */}
            {unreadFeatured && (
              <AnnouncementCard
                announcement={unreadFeatured}
                variant="featured"
                onClick={() => handleAnnouncementClick(unreadFeatured)}
              />
            )}

            {/* Pinned (only unread shown expanded) */}
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

            {/* Unread regular */}
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

            {/* Earlier: compact rows for everything already read */}
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

            {filteredAnnouncements.length === 0 && (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No announcements match your filters</p>
              </div>
            )}
          </div>
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
    </AppLayout>
  );
}
