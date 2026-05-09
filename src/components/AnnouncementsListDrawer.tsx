import { useState, useEffect, useRef, useCallback } from "react";
import { listAnnouncements, markAnnouncementRead, acknowledgeAnnouncement, type Announcement } from "@/data/announcements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, X, Check, ChevronLeft, ChevronRight, Download, FileText, ArrowLeft, ShieldCheck } from "lucide-react";
import { getReadAnnouncementIds, markAnnouncementAsRead } from "@/components/AnnouncementDrawer";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type CategoryFilter = "all" | "Event" | "Academic" | "General";

interface AnnouncementsListDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementsListDrawer({ isOpen, onOpenChange }: AnnouncementsListDrawerProps) {
  const DEFAULT_SNAP_POINT = 0.7;
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [readIds, setReadIds] = useState<Announcement["id"][]>([]);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [snap, setSnap] = useState<number | string | null>(DEFAULT_SNAP_POINT);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    setReadIds(getReadAnnouncementIds());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const loadAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAnnouncements({ limit: 20 });
        if (isMounted) {
          setAnnouncements(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load announcements.";
        if (isMounted) {
          setError(message);
          setAnnouncements([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset to list view when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setCurrentView("list"), 300);
    }
  }, [isOpen]);

  // Reset snap point when opening or switching into detail view.
  useEffect(() => {
    if (isOpen && currentView === "detail") {
      setSnap(DEFAULT_SNAP_POINT);
    }
  }, [isOpen, currentView, currentAnnouncementIndex]);

  // Refresh read status when returning to list
  useEffect(() => {
    if (currentView === "list") {
      setReadIds(getReadAnnouncementIds());
    }
  }, [currentView]);

  const isRead = (announcement: Announcement) => {
    if (announcement.is_read !== undefined) {
      return Boolean(announcement.is_read);
    }
    return readIds.includes(announcement.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const categories: CategoryFilter[] = ["all", "Event", "Academic", "General"];

  const matchesCategory = (category: string, filter: CategoryFilter) => {
    if (filter === "all") return true;
    return category.toLowerCase() === filter.toLowerCase();
  };

  const filteredAnnouncements = announcements.filter(a =>
    matchesCategory(a.category, categoryFilter)
  );

  const currentAnnouncement = filteredAnnouncements[currentAnnouncementIndex];

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    switch (normalized) {
      case "event":
        return "bg-sky-200 text-sky-900 hover:bg-sky-200";
      case "academic":
        return "bg-violet-200 text-violet-900 hover:bg-violet-200";
      case "general":
        return "bg-white text-foreground border border-border hover:bg-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isImageUrl = (url: string) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext ?? '');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
    if (ext === 'doc' || ext === 'docx') return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
    return { icon: FileText, color: "text-primary", bg: "bg-primary/10" };
  };

  const markRead = async (id: Announcement["id"]) => {
    markAnnouncementAsRead(id);
    setReadIds(prev => [...new Set([...prev, id])]);
    try {
      await markAnnouncementRead(id);
      setAnnouncements(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch {
      // Ignore read tracking errors to avoid blocking the UI.
    }
  };

  const handleAnnouncementClick = (index: number) => {
    setCurrentAnnouncementIndex(index);
    void markRead(filteredAnnouncements[index].id);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
  };

  // Swipe navigation for detail view
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentAnnouncementIndex < filteredAnnouncements.length - 1) {
        setSlideDirection("left");
        setTimeout(() => {
          const newIndex = currentAnnouncementIndex + 1;
          setCurrentAnnouncementIndex(newIndex);
          void markRead(filteredAnnouncements[newIndex].id);
          setSlideDirection(null);
        }, 150);
      } else if (deltaX < 0 && currentAnnouncementIndex > 0) {
        setSlideDirection("right");
        setTimeout(() => {
          const newIndex = currentAnnouncementIndex - 1;
          setCurrentAnnouncementIndex(newIndex);
          void markRead(filteredAnnouncements[newIndex].id);
          setSlideDirection(null);
        }, 150);
      }
    }
  }, [currentAnnouncementIndex, filteredAnnouncements, markRead]);

  const goToNext = () => {
    if (currentAnnouncementIndex < filteredAnnouncements.length - 1) {
      setSlideDirection("left");
      setTimeout(() => {
        const newIndex = currentAnnouncementIndex + 1;
        setCurrentAnnouncementIndex(newIndex);
        void markRead(filteredAnnouncements[newIndex].id);
        setSlideDirection(null);
      }, 150);
    }
  };

  const goToPrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        const newIndex = currentAnnouncementIndex - 1;
        setCurrentAnnouncementIndex(newIndex);
        void markRead(filteredAnnouncements[newIndex].id);
        setSlideDirection(null);
      }, 150);
    }
  };

  const attachmentCount = currentAnnouncement?.attachments?.length || 0;

  // Use the first image attachment as the hero image for detail view
  const firstImageAttachment = currentAnnouncement?.attachments?.find(a => isImageUrl(a.url));
  const heroImage = firstImageAttachment?.url ?? currentAnnouncement?.image ?? null;
  const nonHeroAttachments = currentAnnouncement?.attachments?.filter(a => a !== firstImageAttachment) ?? [];

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={currentView === "detail" ? [DEFAULT_SNAP_POINT] : undefined}
      activeSnapPoint={currentView === "detail" ? snap : undefined}
      setActiveSnapPoint={currentView === "detail" ? setSnap : undefined}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[24px] border-t bg-background shadow-2xl outline-none",
            currentView === "detail" && snap === 1 ? "h-[100dvh] rounded-none" : "max-h-[95vh]"
          )}
          style={{ left: 0, right: 0 }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {currentView === "detail" && currentAnnouncement
              ? currentAnnouncement.title
              : "Announcements"}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            {currentView === "detail"
              ? "Announcement details"
              : "Announcements list"}
          </DrawerPrimitive.Description>
          {/* Drag Handle */}
          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-muted-foreground/30 flex-shrink-0" />

          {/* === LIST VIEW === */}
          {currentView === "list" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <h2 className="text-xl font-semibold">Announcements</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-4">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={categoryFilter === category ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap capitalize"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category === "all" ? "All" : category}
                    </Badge>
                  ))}
                </div>

                {/* Announcements List */}
                <div className="space-y-4 pb-8">
                  {loading && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Loading announcements...
                    </p>
                  )}

                  {!loading && error && (
                    <p className="text-sm text-destructive text-center py-8">
                      {error}
                    </p>
                  )}

                  {!loading && !error && filteredAnnouncements.map((announcement, index) => {
                    const cardImageAttachment = announcement.attachments?.find(a => isImageUrl(a.url));
                    const cardImage = cardImageAttachment?.url ?? announcement.image;
                    return (
                    <Card
                      key={announcement.id}
                      className="bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => handleAnnouncementClick(index)}
                    >
                      {/* Image header or default pattern */}
                      <div className="relative h-32 overflow-hidden">
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-2 left-4 w-8 h-8 rounded-full bg-primary/30" />
                              <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-secondary/30" />
                              <div className="absolute bottom-4 left-1/3 w-6 h-6 rounded-full bg-primary/20" />
                            </div>
                            <Megaphone className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                        {/* Combined Category + Date and Read status */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <Badge className={cn("text-xs font-semibold rounded-full px-2.5 py-0.5 border-transparent flex items-center gap-1.5", getCategoryColor(announcement.category))}>
                            <span>{announcement.category}</span>
                            <span className="opacity-50">·</span>
                            <span className="font-medium">{formatDate(announcement.date)}</span>
                          </Badge>
                          {announcement.is_acknowledged ? (
                            <Badge className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-500 hover:bg-blue-100 gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Acknowledged
                            </Badge>
                          ) : isRead(announcement) ? (
                            <Badge className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-green-100 text-green-800 border border-green-500 hover:bg-green-100 gap-1">
                              <Check className="h-3 w-3" />
                              Read
                            </Badge>
                          ) : (
                            <Badge className="text-xs font-semibold rounded-full px-2.5 py-0.5 border-transparent bg-yellow-400 text-yellow-950 hover:bg-yellow-400">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground text-lg mb-2">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {announcement.snippet}
                        </p>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnnouncementClick(index);
                            }}
                          >
                            Read More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}

                  {!loading && !error && filteredAnnouncements.length === 0 && (
                    <div className="text-center py-12">
                      <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No announcements in this category</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* === DETAIL VIEW === */}
          {currentView === "detail" && currentAnnouncement && (
            <>
              {/* Header Bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full px-3"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs font-semibold px-3 py-1", getCategoryColor(currentAnnouncement.category))}>
                    {currentAnnouncement.category}
                  </Badge>
                  {attachmentCount > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <FileText className="h-3 w-3" />
                      {attachmentCount}
                    </Badge>
                  )}
                  {currentAnnouncement.is_acknowledged ? (
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Acknowledged
                    </Badge>
                  ) : isRead(currentAnnouncement) ? (
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10"
                    >
                      <Check className="h-3 w-3" />
                      Read
                    </Badge>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content with swipe detection */}
              <div
                className="flex-1 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <ScrollArea className="h-full">
                  <div 
                    className={cn(
                      "pb-28 transition-all duration-150 ease-out",
                      slideDirection === "left" && "opacity-0 -translate-x-4",
                      slideDirection === "right" && "opacity-0 translate-x-4"
                    )}
                  >
                    {/* Image Header */}
                    <div className="relative h-52 overflow-hidden">
                      {heroImage ? (
                        <img
                          src={heroImage}
                          alt={currentAnnouncement.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-6 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl" />
                            <div className="absolute top-16 right-16 w-28 h-28 rounded-full bg-secondary/20 blur-xl" />
                            <div className="absolute bottom-10 left-1/3 w-16 h-16 rounded-full bg-primary/15 blur-xl" />
                          </div>
                          <Megaphone className="h-20 w-20 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="px-5 -mt-6 relative">
                      {/* Title */}
                      <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                        {currentAnnouncement.title}
                      </h2>

                      {/* Date Pill */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground text-sm mb-5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(currentAnnouncement.date)}
                      </div>

                      {/* Acknowledge Button */}
                      {currentAnnouncement.requires_acknowledgement && (
                        <div className="mb-5">
                          {currentAnnouncement.is_acknowledged ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <ShieldCheck className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                Acknowledged ✅
                              </span>
                            </div>
                          ) : (
                            <Button
                              onClick={async () => {
                                if (acknowledging) return;
                                setAcknowledging(true);
                                try {
                                  await acknowledgeAnnouncement(currentAnnouncement.id);
                                  setAnnouncements(prev =>
                                    prev.map(item => item.id === currentAnnouncement.id ? { ...item, is_acknowledged: true } : item)
                                  );
                                } catch (err) {
                                  console.error("[announcements] Failed to acknowledge:", err);
                                } finally {
                                  setAcknowledging(false);
                                }
                              }}
                              disabled={acknowledging}
                              className="w-full gap-2"
                              variant="default"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              {acknowledging ? "Acknowledging..." : "Acknowledge"}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Attachments */}
                      {nonHeroAttachments.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {nonHeroAttachments.map((attachment, idx) => {
                              const { icon: Icon, color, bg } = getFileIcon(attachment.name);
                              return (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60",
                                    "bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/30",
                                    "group"
                                  )}
                                >
                                  <div className={cn("p-2 rounded-lg", bg)}>
                                    <Icon className={cn("h-5 w-5", color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                                      {attachment.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tap to open</p>
                                  </div>
                                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Full Content */}
                      <div className="prose prose-sm max-w-none">
                        {currentAnnouncement.content.split("\n").map((paragraph, idx) => (
                          <p key={idx} className="mb-4 text-[15px] leading-relaxed text-foreground/85">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Navigation Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t border-border/50 px-4 py-4 pb-6">
                <div className="flex items-center justify-between">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentAnnouncementIndex === 0}
                    className="gap-1.5 rounded-full px-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  {/* Dots Indicator */}
                  <div className="flex items-center gap-2">
                    {filteredAnnouncements.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentAnnouncementIndex(idx);
                          void markRead(filteredAnnouncements[idx].id);
                        }}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          idx === currentAnnouncementIndex
                            ? "w-7 h-2.5 bg-primary"
                            : "w-2.5 h-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                        )}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentAnnouncementIndex === filteredAnnouncements.length - 1}
                    className="gap-1.5 rounded-full px-4"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
