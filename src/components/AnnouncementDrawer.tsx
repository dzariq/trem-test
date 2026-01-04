import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Megaphone, Paperclip, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Announcement {
  id: number;
  title: string;
  snippet: string;
  content: string;
  date: string;
  category: string;
  image: string | null;
  attachments?: { name: string; url: string }[];
}

interface AnnouncementDrawerProps {
  announcements: Announcement[];
  currentIndex: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

export function AnnouncementDrawer({
  announcements,
  currentIndex,
  isOpen,
  onOpenChange,
  onNavigate,
}: AnnouncementDrawerProps) {
  const [snap, setSnap] = useState<number | string | null>(0.6);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentAnnouncement = announcements[currentIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Event":
        return "bg-blue-500 text-white";
      case "Academic":
        return "bg-amber-500 text-white";
      case "General":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
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
        // Swipe left - next
        onNavigate(currentIndex + 1);
      } else if (deltaX < 0 && currentIndex > 0) {
        // Swipe right - previous
        onNavigate(currentIndex - 1);
      }
    }
  }, [currentIndex, announcements.length, onNavigate]);

  const goToNext = () => {
    if (currentIndex < announcements.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  if (!currentAnnouncement) return null;

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[0.6, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[20px] border-t bg-background",
            snap === 1 ? "h-[100dvh]" : "h-auto max-h-[85vh]"
          )}
        >
          {/* Drag Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted flex-shrink-0" />

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-muted/80"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content with swipe detection */}
          <div
            ref={contentRef}
            className="flex-1 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ScrollArea className="h-full">
              <div className="pb-24">
                {/* Image Header */}
                <div className="relative h-48 overflow-hidden">
                  {currentAnnouncement.image ? (
                    <img
                      src={currentAnnouncement.image}
                      alt={currentAnnouncement.title}
                      className="w-full h-full object-cover"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className={getCategoryColor(currentAnnouncement.category)}>
                      {currentAnnouncement.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 pt-4">
                  {/* Title */}
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {currentAnnouncement.title}
                  </h2>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <Calendar className="h-4 w-4" />
                    {formatDate(currentAnnouncement.date)}
                  </div>

                  {/* Full Content */}
                  <div className="prose prose-sm max-w-none text-foreground/90">
                    {currentAnnouncement.content.split("\n").map((paragraph, idx) => (
                      <p key={idx} className="mb-3 text-sm leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Attachments */}
                  {currentAnnouncement.attachments && currentAnnouncement.attachments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments
                      </h3>
                      <div className="space-y-2">
                        {currentAnnouncement.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <Paperclip className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Navigation Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              {/* Dots Indicator */}
              <div className="flex items-center gap-1.5">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      idx === currentIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === announcements.length - 1}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Swipe hint */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Swipe left or right to navigate
            </p>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
