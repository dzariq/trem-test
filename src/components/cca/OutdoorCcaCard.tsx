import { Bus, CalendarDays, MapPin, Bike } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CcaActivityImage } from "./CcaActivityImage";
import { getCcaTypePillColor } from "./CcaTypeTabs";
import { cn } from "@/lib/utils";
import type { InvolvedCcaActivity } from "@/hooks/useTeacherInvolvedCcas";

interface OutdoorCcaCardProps {
  activity: InvolvedCcaActivity;
  onClick?: () => void;
}

/**
 * Outdoor trip card for the teacher's "My CCAs" list. Replaces the generic
 * activity card with:
 *   - "<Trip name> · <Trip date>" as the main title
 *   - Bus PIC chips (Bus A · Main / Bus B · Sub) for the user's actual buses
 *   - Sport PIC chips for each sport they lead inside the trip
 *   - Fallback "Trip PIC" / "Co-PIC" badge when no bus/sport involvement
 */
export function OutdoorCcaCard({ activity, onClick }: OutdoorCcaCardProps) {
  const bucketPill = getCcaTypePillColor(activity.kind ?? activity.category);

  const buses = activity.outdoorBusRoles ?? [];
  const sports = activity.outdoorSportRoles ?? [];
  const isTripPic =
    activity.myRole === "pic" || activity.myRole === "co-pic";

  const dateLabel = activity.nextSessionDate
    ? format(parseISO(activity.nextSessionDate), "d MMM yyyy")
    : null;
  const titleLabel = dateLabel ? `${dateLabel} · Outdoor` : "Outdoor Trip";

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all active:scale-[0.99] bg-card border-border hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Hero image */}
      <div className="relative h-32 overflow-hidden">
        <CcaActivityImage
          imageUrl={activity.imageUrl}
          activityName={activity.name}
          category={activity.category}
          typeName={activity.typeName}
          variant="details"
          className="w-full h-full rounded-none"
        />
        <div className="absolute top-3 right-3">
          <Badge
            className={cn(bucketPill, "border shadow-md gap-1")}
            variant="outline"
          >
            <Bike className="h-3 w-3" />
            Outdoor
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Date-led title */}
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base line-clamp-1">
            {titleLabel}
          </h3>
          {activity.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {activity.location}
            </p>
          )}
        </div>

        {/* Role chips */}
        <div className="flex flex-wrap gap-1.5">
          {buses.map((b) => (
            <Badge
              key={b.busId}
              variant="outline"
              className="border bg-amber-100 text-amber-700 border-amber-200 gap-1"
            >
              <Bus className="h-3 w-3" />
              {b.busName} · {b.slot === "main" ? "Main" : "Sub"}
            </Badge>
          ))}
          {sports.map((s) => (
            <Badge
              key={s.sportActivityId}
              variant="outline"
              className="border bg-emerald-100 text-emerald-700 border-emerald-200"
            >
              Sport PIC · {s.sportName}
            </Badge>
          ))}
          {/* Only fall back to the activity-level PIC chip if no bus/sport
              involvement exists. A bus PIC is shown ONLY as their bus,
              never as a misleading parent-trip PIC. */}
          {buses.length === 0 && sports.length === 0 && isTripPic && (
            <Badge
              variant="outline"
              className="border bg-purple-100 text-purple-700 border-purple-200"
            >
              {activity.myRole === "pic" ? "Trip PIC" : "Trip Co-PIC"}
            </Badge>
          )}
        </div>

        {/* Meta */}
        {dateLabel && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {activity.nextSessionDate &&
              activity.nextSessionDate >= new Date().toISOString().slice(0, 10)
                ? "Next trip"
                : "Last trip"}
              : {dateLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}