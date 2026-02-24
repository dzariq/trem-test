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
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { getAnnouncementAttachments, getAnnouncementById, markAnnouncementRead, acknowledgeAnnouncement, type Announcement, type AnnouncementAttachment } from "@/data/announcements";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdfDialog, setPdfDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: ""
  });
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

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
        }
        if (data) {
          try {
            const fileRows = await getAnnouncementAttachments(data.id);
            if (isMounted) {
              setAttachments(fileRows);
            }
          } catch {
            if (isMounted) {
              setAttachments([]);
            }
          }
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
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleViewPdf = (attachment: { name: string; url: string }) => {
    setPdfDialog({
      open: true,
      url: attachment.url,
      title: attachment.name.replace(".pdf", "")
    });
  };

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
        {/* Hero Image */}
        <div className="relative h-56 overflow-hidden">
          {announcement.image ? (
            <img 
              src={announcement.image} 
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-primary/30" />
                <div className="absolute top-12 right-12 w-24 h-24 rounded-full bg-secondary/30" />
                <div className="absolute bottom-8 left-1/4 w-12 h-12 rounded-full bg-primary/20" />
              </div>
              <Megaphone className="h-20 w-20 text-primary/50" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="px-4 -mt-8 relative z-10">
          {/* Category and Date */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={getCategoryColor(announcement.category)}>
              {announcement.category}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(announcement.date)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {announcement.title}
          </h1>

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

          {/* PDF Attachments - Prominent Section */}
          {attachments.length > 0 && (
            <Card className="bg-primary/5 border-primary/20 mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  Attachments ({attachments.length})
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                          <FileText className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">PDF Document</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPdf(attachment)}
                        className="gap-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Content */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none text-foreground">
                {announcement.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-foreground whitespace-pre-line">
                    {paragraph.split('**').map((text, i) => 
                      i % 2 === 1 ? (
                        <strong key={i} className="font-semibold">{text}</strong>
                      ) : (
                        <span key={i}>{text}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={pdfDialog.open}
        onOpenChange={(open) => setPdfDialog(prev => ({ ...prev, open }))}
        pdfUrl={pdfDialog.url}
        title={pdfDialog.title}
        downloadFileName={`${pdfDialog.title}.pdf`}
      />
    </AppLayout>
  );
}
