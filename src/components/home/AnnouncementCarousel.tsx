import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Megaphone, ShieldCheck } from "lucide-react";
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
    if (c === "general") return "bg-amber-800 text-amber-50 border-transparent hover:bg-amber-800";
    return "";
  };

  const mainAnnouncement = resolvedAnnouncements[0];
  const otherAnnouncements = resolvedAnnouncements.slice(1, 4);

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
          <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
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
          onClick={() => handleAnnouncementClick(0)}
        >
          {/* Large Image Header */}
          <div className="relative h-48 overflow-hidden">
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
              <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 text-xs">
                Featured
              </Badge>
              {isAcknowledged(mainAnnouncement) ? (
                <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10 backdrop-blur-sm">
                  <ShieldCheck className="h-3 w-3" />
                  Acknowledged
                </Badge>
              ) : isRead(mainAnnouncement) ? (
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10 backdrop-blur-sm">
                  <Check className="h-3 w-3" />
                  Read
                </Badge>
              ) : (
                <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 text-xs backdrop-blur-sm">
                  New
                </Badge>
              )}
            </div>
            {/* Category and Date */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", getCategoryBadgeClass(mainAnnouncement.category))}>
                  {mainAnnouncement.category}
                </Badge>
                {!isRead(mainAnnouncement) && !isAcknowledged(mainAnnouncement) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                <Badge variant="outline" className="text-xs bg-card/80 backdrop-blur-sm">
                  {formatDate(mainAnnouncement.date)}
                </Badge>
              </div>
            </div>
          <CardContent className="p-4">
              <h3 className="font-bold text-foreground text-lg mb-2">
                {mainAnnouncement.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {mainAnnouncement.snippet}
              </p>
            <Button 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleAnnouncementClick(0);
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
              {otherAnnouncements.map((announcement, idx) => (
                <CarouselItem key={announcement.id} className="pl-2 basis-[75%]">
                  <Card 
                    className="bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => handleAnnouncementClick(idx + 1)}
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
                        <Badge variant="secondary" className={cn("text-[10px]", getCategoryBadgeClass(announcement.category))}>
                          {announcement.category}
                        </Badge>
                        {isAcknowledged(announcement) ? (
                          <Badge variant="outline" className="text-[10px] gap-0.5 text-blue-600 border-blue-600/30 bg-blue-500/10 backdrop-blur-sm px-1.5">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Ack'd
                          </Badge>
                        ) : isRead(announcement) ? (
                          <Badge variant="outline" className="text-[10px] gap-0.5 text-green-600 border-green-600/30 bg-green-500/10 backdrop-blur-sm px-1.5">
                            <Check className="h-2.5 w-2.5" />
                            Read
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 text-[10px] px-1.5">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3 pt-2">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {announcement.snippet}
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
