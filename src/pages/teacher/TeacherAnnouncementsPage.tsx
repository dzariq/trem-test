import { useEffect, useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck } from "lucide-react";
import { listAnnouncements, type Announcement } from "@/data/announcements";

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAnnouncements({ limit: 50 });
        if (isMounted) {
          setAnnouncements(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load announcements.";
          setError(message);
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
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <TeacherAppLayout>
      <AppHeader title="Announcements" showBack />

      <section className="px-4 pt-4 pb-6 space-y-3">
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

        {!loading && !error && announcements.map((announcement) => (
          <Card key={announcement.id} className="bg-card border-border shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground text-base">
                  {announcement.title}
                </h3>
                {announcement.is_acknowledged ? (
                  <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10">
                    <ShieldCheck className="h-3 w-3" />
                    Acknowledged
                  </Badge>
                ) : announcement.is_read ? (
                  <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-600/30 bg-green-500/10">
                    <Check className="h-3 w-3" />
                    Read
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(announcement.date)}</span>
                <Badge variant="outline" className="text-[10px]">
                  {announcement.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </TeacherAppLayout>
  );
}
