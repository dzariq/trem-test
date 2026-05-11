import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Calendar, 
  Megaphone, 
  FileText,
  Eye,
  ShieldCheck
} from "lucide-react";
import { getAnnouncementById, markAnnouncementRead, acknowledgeAnnouncement, type Announcement, type AnnouncementAttachment } from "@/data/announcements";
import { AnnouncementHtmlContent } from "@/components/announcements/AnnouncementHtmlContent";
import { AnnouncementPdfBanner, isPdfAttachment } from "@/components/announcements/AnnouncementPdfBanner";
import { ImagePreviewDialog } from "@/components/announcements/ImagePreviewDialog";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncement = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAnnouncementById(id);
        if (isMounted) {
          setAnnouncement(data);
          // Use attachments from the announcement itself (already resolved)
          setAttachments(data?.attachments ?? []);
        }
        if (data) {
          void markAnnouncementRead(data.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load announcement.";
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnnouncement();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <AppHeader 
          leftContent={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Announcement</h1>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Megaphone className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Loading announcement</h2>
          <p className="text-muted-foreground text-center mb-4">
            Fetching announcement details...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error || !announcement) {
    return (
      <AppLayout>
        <AppHeader 
          leftContent={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Announcement</h1>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Megaphone className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {error ? "Unable to load announcement" : "Announcement Not Found"}
          </h2>
          <p className="text-muted-foreground text-center mb-4">
            {error || "The announcement you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate("/parent/announcements")}>
            Back to Announcements
          </Button>
        </div>
      </AppLayout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "long",
      month: "long", 
      day: "numeric",
      year: "numeric"
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
        return "bg-white text-foreground border border-border hover:bg-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const coverUrl = announcement.image;
  const otherAttachments = attachments.filter(
    (a) => !isPdfAttachment(a) && a.url !== coverUrl,
  );

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Announcement</h1>
          </div>
        }
      />

      <section className="pb-6">
        {/* Cover Image (landscape hero) */}
        {coverUrl && (
          <button
            type="button"
            className="block w-full"
            onClick={() => setImagePreviewOpen(true)}
            aria-label="Preview cover image"
          >
            <img
              src={coverUrl}
              alt={announcement.title}
              className="w-full aspect-[16/9] object-cover"
            />
          </button>
        )}

        {/* Content */}
        <div className="px-4 pt-4 relative z-10">
          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {announcement.title}
          </h1>

          {/* Category and Date */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className={getCategoryColor(announcement.category)}>
              {announcement.category}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(announcement.date)}
            </span>
          </div>

          {/* PDF Banner */}
          <AnnouncementPdfBanner attachments={attachments} className="mb-5" />

          {/* Rich HTML Body */}
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-4">
              <AnnouncementHtmlContent
                html={announcement.content}
                coverUrl={coverUrl}
              />
            </CardContent>
          </Card>

          {/* Other (non-PDF, non-cover) attachments */}
          {otherAttachments.length > 0 && (
            <Card className="bg-card border-border mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  Attachments ({otherAttachments.length})
                </h3>
                <div className="space-y-2">
                  {otherAttachments.map((attachment, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => void openExternal(attachment.url)}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium text-foreground text-sm truncate">
                          {attachment.name}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acknowledge Button */}
          {announcement.requires_acknowledgement && (
            <div className="mb-5">
              {announcement.is_acknowledged ? (
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
                      await acknowledgeAnnouncement(announcement.id);
                      setAnnouncement(prev => prev ? { ...prev, is_acknowledged: true } : prev);
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
        </div>
      </section>
      <ImagePreviewDialog
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        src={coverUrl}
        alt={announcement.title}
      />
    </AppLayout>
  );
}
