import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Star, ShieldCheck, Calendar } from "lucide-react";
import type { Announcement } from "@/data/announcements";

interface Props {
  announcement: Announcement;
  onClick: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export function FeaturedAnnouncementCard({ announcement, onClick }: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-md bg-card border border-border"
      onClick={onClick}
    >
      {/* Hero image or gradient */}
      <div className="relative h-40">
        {announcement.image ? (
          <img
            src={announcement.image}
            alt={announcement.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/20 flex items-center justify-center">
            <Megaphone className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 gap-1">
            <Star className="h-3 w-3" />
            Featured
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

      {/* Content */}
      <div className="px-4 py-4">
        <h3 className="font-bold text-foreground text-lg mb-1 leading-tight">
          {announcement.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
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
      </div>
    </div>
  );
}
