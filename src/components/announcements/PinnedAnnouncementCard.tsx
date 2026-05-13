import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, ShieldCheck, Calendar, Megaphone } from "lucide-react";
import type { Announcement } from "@/data/announcements";

interface Props {
  announcement: Announcement;
  onClick: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export function PinnedAnnouncementCard({ announcement, onClick }: Props) {
  return (
    <Card
      className="bg-card border-border shadow-sm cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
      onClick={onClick}
    >
      <div className="relative h-32 overflow-hidden">
        {announcement.image ? (
          <img
            src={announcement.image}
            alt={announcement.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
            <Megaphone className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary gap-1.5">
            <Pin className="h-3 w-3 rotate-45" />
            Pinned
          </Badge>
        </div>
        {announcement.requires_acknowledgement && (
          <div className="absolute top-3 right-3">
            {announcement.is_acknowledged ? (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10 backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3" />
                Acknowledged
              </Badge>
            ) : (
              <Badge className="bg-destructive text-destructive-foreground text-xs gap-1">
                <ShieldCheck className="h-3 w-3" />
                Action Required
              </Badge>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground text-lg mb-2">
          {announcement.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {announcement.snippet}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(announcement.date)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Read More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
