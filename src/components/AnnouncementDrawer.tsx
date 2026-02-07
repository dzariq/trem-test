import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, ChevronLeft, ChevronRight, Download, FileText, Megaphone, X, List } from "lucide-react";

type AnnouncementId = number | string;

const READ_ANNOUNCEMENTS_KEY = "readAnnouncementIds";

export const getReadAnnouncementIds = (): AnnouncementId[] => {
  try {
    const stored = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const markAnnouncementAsRead = (id: AnnouncementId): void => {
  const readIds = getReadAnnouncementIds();
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(readIds));
  }
};
import { ScrollArea } from "@/components/ui/scroll-area";

interface Announcement {
  id: AnnouncementId;
  title: string;
  snippet: string;
  content: string;
  date: string;
  category: string;
  image: string | null;
  attachments?: { name: string; url: string }[];
  is_read?: boolean;
}

interface AnnouncementDrawerProps {
  announcements: Announcement[];
  currentIndex: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
  onSeeAll?: () => void;
}

// Snap points: 60% half screen, 100% full screen
const SNAP_POINTS = [0.6, 1] as const;
const DEFAULT_SNAP = 0.6;

export function AnnouncementDrawer({
  announcements,
  currentIndex,
  isOpen,
  onOpenChange,
  onNavigate,
  onSeeAll,
}: AnnouncementDrawerProps) {
  // Use shared snap points for consistent drag behavior
  const [snap, setSnap] = useState<number | string | null>(DEFAULT_SNAP);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [isRead, setIsRead] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSeeAll = () => {
    onOpenChange(false);
    if (onSeeAll) {
      onSeeAll();
    }
  };

  const currentAnnouncement = announcements[currentIndex];

  // Mark as read when drawer opens or announcement changes
  useEffect(() => {
    if (isOpen && currentAnnouncement) {
      markAnnouncementAsRead(currentAnnouncement.id);
      setIsRead(true);
    }
  }, [isOpen, currentAnnouncement]);

  // Check read status when announcement changes
  useEffect(() => {
    if (currentAnnouncement) {
      if (currentAnnouncement.is_read !== undefined) {
        setIsRead(currentAnnouncement.is_read);
      } else {
        const readIds = getReadAnnouncementIds();
        setIsRead(readIds.includes(currentAnnouncement.id));
      }
    }
  }, [currentAnnouncement]);

  // Set default snap only when drawer first opens, NOT when navigating between announcements
  useEffect(() => {
    if (isOpen) {
      setSnap(DEFAULT_SNAP);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Intentionally exclude currentIndex to preserve snap when navigating

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    switch (normalized) {
      case "event":
        return "bg-blue-500 text-white";
      case "academic":
        return "bg-amber-500 text-white";
      case "general":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
    if (ext === 'doc' || ext === 'docx') return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
    return { icon: FileText, color: "text-primary", bg: "bg-primary/10" };
  };

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
      if (deltaX > 0 && currentIndex < announcements.length - 1) {
        setSlideDirection("left");
        setTimeout(() => {
          onNavigate(currentIndex + 1);
          setSlideDirection(null);
        }, 150);
      } else if (deltaX < 0 && currentIndex > 0) {
        setSlideDirection("right");
        setTimeout(() => {
          onNavigate(currentIndex - 1);
          setSlideDirection(null);
        }, 150);
      }
    }
  }, [currentIndex, announcements.length, onNavigate]);

  const goToNext = () => {
    if (currentIndex < announcements.length - 1) {
      setSlideDirection("left");
      setTimeout(() => {
        onNavigate(currentIndex + 1);
        setSlideDirection(null);
      }, 150);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        onNavigate(currentIndex - 1);
        setSlideDirection(null);
      }, 150);
    }
  };

  if (!currentAnnouncement) return null;

  const attachmentCount = currentAnnouncement.attachments?.length || 0;

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={SNAP_POINTS as unknown as (number | string)[]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[24px] border-t bg-background shadow-2xl outline-none pb-[var(--safe-bottom)]",
            snap === 1 ? "h-[calc(100dvh-var(--safe-top))] rounded-none pt-[var(--safe-top)]" : "h-auto max-h-[calc(100vh-var(--safe-top)-var(--safe-bottom))]"
          )}
          style={{ left: 0, right: 0 }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {currentAnnouncement.title}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Announcement details
          </DrawerPrimitive.Description>
          {/* Drag Handle */}
          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-muted-foreground/30 flex-shrink-0" />

          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
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
              {isRead && (
                <Badge 
                  variant="outline" 
                  className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10 animate-in zoom-in-50 fade-in duration-300"
                >
                  <Check className="h-3 w-3 animate-in spin-in-180 duration-500" />
                  Read
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onSeeAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:bg-primary/10 rounded-full px-3 gap-1"
                  onClick={handleSeeAll}
                >
                  <List className="h-3.5 w-3.5" />
                  See All
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content with swipe detection */}
          <div
            ref={contentRef}
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
                  {currentAnnouncement.image ? (
                    <img
                      src={currentAnnouncement.image}
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

                  {/* Attachments - Moved Up */}
                  {currentAnnouncement.attachments && currentAnnouncement.attachments.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {currentAnnouncement.attachments.map((attachment, idx) => {
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
          <div className="absolute bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t border-border/50 px-5 py-4 pb-[calc(1.5rem+var(--safe-bottom))]">
            <div className="flex items-center justify-between gap-4">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="gap-1 rounded-full px-3 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              {/* Dots Indicator */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center overflow-hidden">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      "rounded-full transition-all duration-200 flex-shrink-0",
                      idx === currentIndex
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                    )}
                  />
                ))}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === announcements.length - 1}
                className="gap-1 rounded-full px-3 flex-shrink-0"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

