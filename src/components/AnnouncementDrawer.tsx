import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, ChevronLeft, ChevronRight, Download, FileText, Megaphone, Inbox, ShieldCheck } from "lucide-react";
import { markAnnouncementRead, acknowledgeAnnouncement } from "@/data/announcements";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";

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
  requires_acknowledgement?: boolean;
  is_acknowledged?: boolean;
}

interface AnnouncementDrawerProps {
  announcements: Announcement[];
  currentIndex: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
  onSeeAll?: () => void;
  onAnnouncementUpdated?: (id: AnnouncementId, updates: Partial<Announcement>) => void;
}

export function AnnouncementDrawer({
  announcements,
  currentIndex,
  isOpen,
  onOpenChange,
  onNavigate,
  onSeeAll,
  onAnnouncementUpdated,
}: AnnouncementDrawerProps) {
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [isRead, setIsRead] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [pdfDialog, setPdfDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const readMarkedRef = useRef<Set<string>>(new Set());

  const handleSeeAll = () => {
    onOpenChange(false);
    if (onSeeAll) {
      onSeeAll();
    }
  };

  const currentAnnouncement = announcements[currentIndex];

  // Mark as read when drawer opens or announcement changes - only once per announcement
  useEffect(() => {
    if (isOpen && currentAnnouncement) {
      const idStr = String(currentAnnouncement.id);
      if (!readMarkedRef.current.has(idStr)) {
        readMarkedRef.current.add(idStr);
        markAnnouncementAsRead(currentAnnouncement.id);
        setIsRead(true);
        // Fire Supabase upsert (fire and forget)
        void markAnnouncementRead(currentAnnouncement.id).catch(() => {});
        onAnnouncementUpdated?.(currentAnnouncement.id, { is_read: true });
      }
    }
  }, [isOpen, currentAnnouncement?.id]);

  // Sync acknowledged state from announcement data
  useEffect(() => {
    if (currentAnnouncement) {
      setIsRead(currentAnnouncement.is_read ?? getReadAnnouncementIds().includes(currentAnnouncement.id));
      setIsAcknowledged(currentAnnouncement.is_acknowledged ?? false);
    }
  }, [currentAnnouncement?.id]);

  // Clear tracked read set when drawer closes
  useEffect(() => {
    if (!isOpen) {
      readMarkedRef.current.clear();
    }
  }, [isOpen]);

  // Lock body scroll while full-screen view is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleAcknowledge = async () => {
    if (!currentAnnouncement || isAcknowledged || acknowledging) return;
    setAcknowledging(true);
    try {
      await acknowledgeAnnouncement(currentAnnouncement.id);
      setIsAcknowledged(true);
      onAnnouncementUpdated?.(currentAnnouncement.id, { is_acknowledged: true });
    } catch (err) {
      console.error("[announcements] Failed to acknowledge:", err);
    } finally {
      setAcknowledging(false);
    }
  };

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

  const isImageUrl = (url: string) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext ?? '');
  };

  const isPdfUrl = (url: string, name?: string) => {
    const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase();
    const fromName = name?.split('.').pop()?.toLowerCase();
    return fromUrl === 'pdf' || fromName === 'pdf';
  };

  const openPdf = (attachment: { name: string; url: string }) => {
    setPdfDialog({
      open: true,
      url: attachment.url,
      title: attachment.name.replace(/\.pdf$/i, ''),
    });
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
  if (!isOpen) {
    return (
      <PDFViewerDialog
        open={pdfDialog.open}
        onOpenChange={(open) => setPdfDialog((prev) => ({ ...prev, open }))}
        pdfUrl={pdfDialog.url}
        title={pdfDialog.title}
        downloadFileName={`${pdfDialog.title}.pdf`}
      />
    );
  }

  const attachmentCount = currentAnnouncement.attachments?.length || 0;
  const firstImageAttachment = currentAnnouncement.attachments?.find(a => isImageUrl(a.url));
  const heroImage = firstImageAttachment?.url ?? currentAnnouncement.image;
  const nonHeroAttachments = currentAnnouncement.attachments?.filter(a => a !== firstImageAttachment) ?? [];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={currentAnnouncement.title}
        className="fixed inset-0 z-[100] flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[var(--safe-bottom)] animate-in fade-in slide-in-from-right-2 duration-200"
      >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg flex-shrink-0"
                onClick={() => onOpenChange(false)}
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Badge className={cn("text-xs font-semibold px-3 py-1", getCategoryColor(currentAnnouncement.category))}>
                {currentAnnouncement.category}
              </Badge>
              {attachmentCount > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  {attachmentCount}
                </Badge>
              )}
              {isAcknowledged ? (
                <Badge 
                  variant="outline" 
                  className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10 animate-in zoom-in-50 fade-in duration-300"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Acknowledged
                </Badge>
              ) : isRead ? (
                <Badge 
                  variant="outline" 
                  className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10 animate-in zoom-in-50 fade-in duration-300"
                >
                  <Check className="h-3 w-3 animate-in spin-in-180 duration-500" />
                  Read
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onSeeAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:bg-primary/10 rounded-full px-3 gap-1"
                  onClick={handleSeeAll}
                >
                  <Inbox className="h-3.5 w-3.5" />
                  Inbox
                </Button>
              )}
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
                </div>

                {/* Content */}
                <div className="px-5 mt-4 relative">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                    {currentAnnouncement.title}
                  </h2>

                  {/* Date Pill + Attachment Quick Links */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(currentAnnouncement.date)}
                    </div>
                    {(currentAnnouncement.attachments ?? []).map((attachment, idx) => {
                      const isImg = isImageUrl(attachment.url);
                      const isPdf = isPdfUrl(attachment.url, attachment.name);
                      const { icon: Icon, color, bg } = getFileIcon(attachment.name);
                      return (
                        <button
                          key={`quick-${idx}`}
                          type="button"
                          onClick={() => {
                            if (isPdf) {
                              openPdf(attachment);
                            } else {
                              window.open(attachment.url, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-xs font-medium text-foreground max-w-[180px]"
                          )}
                          title={attachment.name}
                        >
                          <span className={cn("p-1 rounded-md", bg)}>
                            <Icon className={cn("h-3 w-3", color)} />
                          </span>
                          <span className="truncate">
                            {isImg ? "View image" : attachment.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Acknowledge Button */}
                  {currentAnnouncement.requires_acknowledgement && (
                    <div className="mb-5">
                      {isAcknowledged ? (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Acknowledged ✅
                          </span>
                        </div>
                      ) : (
                        <Button
                          onClick={handleAcknowledge}
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
                          const isPdf = isPdfUrl(attachment.url, attachment.name);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isPdf) {
                                  openPdf(attachment);
                                } else {
                                  window.open(attachment.url, "_blank", "noopener,noreferrer");
                                }
                              }}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60",
                                "bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/30",
                                "group text-left"
                              )}
                            >
                              <div className={cn("p-2 rounded-lg", bg)}>
                                <Icon className={cn("h-5 w-5", color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isPdf ? "Tap to read" : "Tap to open"}
                                </p>
                              </div>
                              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
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
          <div
            className="absolute left-0 right-0 bottom-0 bg-background/98 backdrop-blur-md border-t border-border/50 px-5 py-4 pb-[calc(1rem+var(--safe-bottom))]"
          >
            <div className="flex items-center justify-between gap-4">
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
      </div>
      <PDFViewerDialog
        open={pdfDialog.open}
        onOpenChange={(open) => setPdfDialog((prev) => ({ ...prev, open }))}
        pdfUrl={pdfDialog.url}
        title={pdfDialog.title}
        downloadFileName={`${pdfDialog.title}.pdf`}
      />
    </>
  );
}
