import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Megaphone, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AnnouncementDrawer, getReadAnnouncementIds } from "@/components/AnnouncementDrawer";
import { AnnouncementsListDrawer } from "@/components/AnnouncementsListDrawer";
import type { Announcement, AnnouncementId } from "@/data/announcements";

interface AnnouncementCarouselProps {
  announcements?: Announcement[];
  onSeeAll?: () => void;
  onMarkRead?: (id: AnnouncementId) => void;
  enableListDrawer?: boolean;
}

export function AnnouncementCarousel({
  announcements,
  onSeeAll,
  onMarkRead,
  enableListDrawer = true,
}: AnnouncementCarouselProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [listDrawerOpen, setListDrawerOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [readIds, setReadIds] = useState<AnnouncementId[]>([]);

  const resolvedAnnouncements = useMemo(
    () => announcements ?? [],
    [announcements]
  );

  // Load read status on mount and when drawer closes
  useEffect(() => {
    setReadIds(getReadAnnouncementIds());
  }, []);

  // Refresh read status when drawer closes
  useEffect(() => {
    if (!drawerOpen && !listDrawerOpen) {
      setReadIds(getReadAnnouncementIds());
    }
  }, [drawerOpen, listDrawerOpen]);

  const isRead = (announcement: Announcement) => {
    if (announcement.is_read !== undefined) return announcement.is_read;
    return readIds.includes(announcement.id);
  };

  const isAcknowledged = (announcement: Announcement) => {
    return announcement.is_acknowledged ?? false;
  };

  const handleAnnouncementUpdated = (id: AnnouncementId, updates: Partial<Announcement>) => {
    // This allows local state to update without a full refresh
    // The parent can optionally handle this
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryBadgeClass = (category: string) => {
    const c = (category ?? "").toLowerCase();
    if (c === "general") return "bg-white text-foreground border border-border hover:bg-white";
    if (c === "event") return "bg-sky-200 text-sky-900 border-transparent hover:bg-sky-200";
    if (c === "academic") return "bg-violet-200 text-violet-900 border-transparent hover:bg-violet-200";
    return "bg-muted text-muted-foreground border-transparent";
  };

  const badgeBase = "text-xs font-semibold rounded-full px-2.5 py-0.5 border-transparent";
  const readBadgeClass = `${badgeBase} bg-green-100 text-green-800 border border-green-500 hover:bg-green-100 gap-1`;
  const ackBadgeClass = `${badgeBase} bg-blue-100 text-blue-800 border border-blue-500 hover:bg-blue-100 gap-1`;
  const newBadgeClass = `${badgeBase} bg-yellow-400 text-yellow-950 hover:bg-yellow-400`;
  const featuredBadgeClass = "rounded-full p-1.5 bg-yellow-400 text-yellow-950 hover:bg-yellow-400 inline-flex items-center justify-center border-transparent";

  // Featured: first announcement flagged as featured, else first overall
  const mainAnnouncement =
    resolvedAnnouncements.find((a) => a.is_featured) ?? resolvedAnnouncements[0];

  // Below: pinned posts first, then the rest. Show up to 7 cards total.
  const remaining = resolvedAnnouncements.filter((a) => a.id !== mainAnnouncement?.id);
  const pinned = remaining.filter((a) => a.is_pinned);
  const nonPinned = remaining.filter((a) => !a.is_pinned);
  const otherAnnouncements = [...pinned, ...nonPinned].slice(0, 7);

  // Build the index map so click handlers open the correct announcement in the drawer
  const indexOf = (id: AnnouncementId) =>
    resolvedAnnouncements.findIndex((a) => a.id === id);

  const handleAnnouncementClick = (index: number) => {
    setCurrentAnnouncementIndex(index);
    setDrawerOpen(true);
    const announcement = resolvedAnnouncements[index];
    if (announcement && onMarkRead) {
      onMarkRead(announcement.id);
    }
  };

  if (resolvedAnnouncements.length === 0) {
    return (
      <section className="py-4">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="text-lg font-semibold text-foreground text-center">Announcements</h2>
        </div>
        <div className="px-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No announcements available.
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto text-sm"
          onClick={onSeeAll ?? (() => setListDrawerOpen(true))}
        >
          See all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Featured Main Announcement */}
      <div className="px-4 mb-4">
        <Card 
          className="bg-card border-border shadow-md overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => handleAnnouncementClick(indexOf(mainAnnouncement.id))}
        >
          {/* Large Image Header */}
          <div className="relative h-36 overflow-hidden">
            {mainAnnouncement.image ? (
              <img 
                src={mainAnnouncement.image} 
                alt={mainAnnouncement.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-primary/30" />
                  <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-secondary/30" />
                  <div className="absolute bottom-8 left-1/4 w-12 h-12 rounded-full bg-primary/20" />
                </div>
                <Megaphone className="h-16 w-16 text-primary/50" />
              </div>
            )}
            {/* Featured Badge & Read Status */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              {mainAnnouncement.is_featured ? (
                <Badge className={featuredBadgeClass} aria-label="Featured">
                  <Star className="h-3.5 w-3.5 fill-current" />
                </Badge>
              ) : (
                <span />
              )}
              {isAcknowledged(mainAnnouncement) ? (
                <Badge className={ackBadgeClass}>
                  <ShieldCheck className="h-3 w-3" />
                  Acknowledged
                </Badge>
              ) : isRead(mainAnnouncement) ? (
                <Badge className={readBadgeClass}>
                  <Check className="h-3 w-3" />
                  Read
                </Badge>
              ) : (
                <Badge className={newBadgeClass}>
                  New
                </Badge>
              )}
            </div>
            {/* Combined Category + Date */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <Badge className={cn(badgeBase, getCategoryBadgeClass(mainAnnouncement.category), "flex items-center gap-1.5")}>
                <span>{mainAnnouncement.category}</span>
                <span className="opacity-50">·</span>
                <span className="font-medium">{formatDate(mainAnnouncement.date)}</span>
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
              <h3 className="font-bold text-foreground text-lg mb-2">
                {mainAnnouncement.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {mainAnnouncement.snippet}
              </p>
            <Button 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleAnnouncementClick(indexOf(mainAnnouncement.id));
              }}
            >
              Read More
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Other Announcements Carousel */}
      {otherAnnouncements.length > 0 && (
        <div className="px-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {otherAnnouncements.map((announcement) => (
                <CarouselItem key={announcement.id} className="pl-2 basis-[75%]">
                  <Card 
                    className="bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform h-full flex flex-col"
                    onClick={() => handleAnnouncementClick(indexOf(announcement.id))}
                  >
                    <div className="relative h-20 overflow-hidden">
                      {announcement.image ? (
                        <img 
                          src={announcement.image} 
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                          <Megaphone className="h-8 w-8 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <Badge className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 border-transparent flex items-center gap-1", getCategoryBadgeClass(announcement.category))}>
                          <span>{announcement.category}</span>
                          <span className="opacity-50">·</span>
                          <span>{formatDate(announcement.date)}</span>
                        </Badge>
                        {isAcknowledged(announcement) ? (
                          <Badge className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-500 hover:bg-blue-100 gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Ack'd
                          </Badge>
                        ) : isRead(announcement) ? (
                          <Badge className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-800 border border-green-500 hover:bg-green-100 gap-0.5">
                            <Check className="h-2.5 w-2.5" />
                            Read
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] font-semibold rounded-full px-2 py-0.5 border-transparent bg-yellow-400 text-yellow-950 hover:bg-yellow-400">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3 pt-2 flex-1 flex flex-col">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {announcement.snippet || "\u00A0"}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-2" />
            <CarouselNext className="hidden sm:flex -right-2" />
          </Carousel>
        </div>
      )}

      {/* Announcement Drawer */}
      <AnnouncementDrawer
        announcements={resolvedAnnouncements}
        currentIndex={currentAnnouncementIndex}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        onNavigate={setCurrentAnnouncementIndex}
        onSeeAll={onSeeAll ?? (() => setListDrawerOpen(true))}
        onAnnouncementUpdated={handleAnnouncementUpdated}
      />

      {/* Announcements List Drawer */}
      {enableListDrawer && (
        <AnnouncementsListDrawer
          isOpen={listDrawerOpen}
          onOpenChange={setListDrawerOpen}
        />
      )}
    </section>
  );
}
