import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, ShieldCheck, Calendar } from "lucide-react";
import type { Announcement } from "@/data/announcements";

interface Props {
  announcement: Announcement;
  onClick: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function PinnedAnnouncementCard({ announcement, onClick }: Props) {
  return (
    <Card
      className="bg-card border-border shadow-sm cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Pin className="h-4 w-4 text-primary rotate-45" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground text-sm truncate flex-1">
                {announcement.title}
              </h4>
              {announcement.requires_acknowledgement && (
                announcement.is_acknowledged ? (
                  <Badge variant="outline" className="text-[10px] gap-0.5 text-blue-600 border-blue-600/30 bg-blue-500/10 flex-shrink-0">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Done
                  </Badge>
                ) : (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] flex-shrink-0">
                    Acknowledge
                  </Badge>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {announcement.snippet}
            </p>
            <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(announcement.date)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
