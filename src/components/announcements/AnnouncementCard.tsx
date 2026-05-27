import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  ChevronRight,
  Megaphone,
  Pin,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Announcement } from "@/data/announcements";
import { cn } from "@/lib/utils";

type Variant = "featured" | "pinned" | "regular";

interface Props {
  announcement: Announcement;
  variant: Variant;
  onClick: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getPriorityStyles = (priority?: string) => {
  switch ((priority ?? "").toLowerCase()) {
    case "high":
      return {
        className: "bg-red-500 text-white hover:bg-red-500",
        label: "High Priority",
      };
    case "low":
      return {
        className: "bg-emerald-500 text-white hover:bg-emerald-500",
        label: "Low Priority",
      };
    case "medium":
    default:
      return {
        className: "bg-amber-500 text-white hover:bg-amber-500",
        label: "Medium Priority",
      };
  }
};

const variantConfig: Record<
  Variant,
  {
    Icon: typeof Star;
    accent: string;
    accentSoft: string;
    chip: string;
    chipLabel: string;
  }
> = {
  featured: {
    Icon: Star,
    accent: "text-amber-600",
    accentSoft: "bg-amber-500/10",
    chip: "bg-amber-400 text-amber-950 hover:bg-amber-400",
    chipLabel: "Featured",
  },
  pinned: {
    Icon: Pin,
    accent: "text-primary",
    accentSoft: "bg-primary/10",
    chip: "bg-primary text-primary-foreground hover:bg-primary",
    chipLabel: "Pinned",
  },
  regular: {
    Icon: Megaphone,
    accent: "text-muted-foreground",
    accentSoft: "bg-muted",
    chip: "bg-secondary text-secondary-foreground",
    chipLabel: "Announcement",
  },
};

/**
 * Unified announcement card.
 * - Unread → hero card (image + title + snippet + date)
 * - Read   → compact single-row strip (tiny icon + title + date + chevron)
 */
export function AnnouncementCard({ announcement, variant, onClick }: Props) {
  const cfg = variantConfig[variant];
  const Icon = cfg.Icon;
  const isUnread = !announcement.is_read;
  const priority = getPriorityStyles(announcement.priority);

  // ───────────── COMPACT (read) ─────────────
  if (!isUnread) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full text-left flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5",
          "active:scale-[0.99] transition-transform hover:bg-muted/40"
        )}
      >
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
            cfg.accentSoft
          )}
        >
          <Icon className={cn("h-4 w-4", cfg.accent, variant === "pinned" && "rotate-45")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {announcement.title}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {formatDate(announcement.date)}
            {announcement.requires_acknowledgement && announcement.is_acknowledged && (
              <>
                <span className="mx-1">·</span>
                <ShieldCheck className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600">Acknowledged</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  }

  // ───────────── EXPANDED (unread) ─────────────
  const showHero = variant !== "regular" || Boolean(announcement.image);

  return (
    <Card
      className={cn(
        "bg-card border-border shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      )}
      onClick={onClick}
    >
      {showHero && (
        <div className={cn("relative overflow-hidden", variant === "featured" ? "h-40" : "h-32")}>
          {announcement.image ? (
            <img
              src={announcement.image}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center", cfg.accentSoft)}>
              <Icon
                className={cn(
                  "h-14 w-14 opacity-40",
                  cfg.accent,
                  variant === "pinned" && "rotate-45"
                )}
              />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            {variant !== "regular" ? (
              <Badge className={cn(cfg.chip, "gap-1")}>
                <Icon className={cn("h-3 w-3", variant === "pinned" && "rotate-45")} />
                {cfg.chipLabel}
              </Badge>
            ) : (
              <Badge className={cn(priority.className, "gap-1.5")}>
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {priority.label}
              </Badge>
            )}
          </div>

          {announcement.requires_acknowledgement && (
            <div className="absolute top-3 right-3">
              {announcement.is_acknowledged ? (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 text-blue-600 border-blue-600/30 bg-blue-500/10 backdrop-blur-sm"
                >
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
      )}

      <CardContent className={cn("p-4", !showHero && "pt-4")}>
        {!showHero && (
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(priority.className, "gap-1.5")}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {priority.label}
            </Badge>
            {announcement.requires_acknowledgement && !announcement.is_acknowledged && (
              <Badge className="bg-destructive text-destructive-foreground text-xs gap-1">
                <ShieldCheck className="h-3 w-3" />
                Action Required
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3
            className={cn(
              "text-foreground leading-tight",
              variant === "featured" ? "text-lg font-bold" : "text-base font-semibold"
            )}
          >
            {announcement.title}
          </h3>
          <span
            className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0"
            aria-label="Unread"
          />
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {announcement.snippet}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(announcement.date)}
          </span>
          <span className="text-xs font-medium text-primary flex items-center gap-0.5">
            Read more
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
