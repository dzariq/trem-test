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
  /** Adds an "Upcoming" pill (top-left of hero) and a soft yellow card highlight. */
  isUpcoming?: boolean;
}

/**
 * Outdoor trip card for the teacher's "My CCAs" list. Replaces the generic
 * activity card with:
 *   - "<Trip name> · <Trip date>" as the main title
 *   - Bus PIC chips (Bus A · Main / Bus B · Sub) for the user's actual buses
 *   - Sport PIC chips for each sport they lead inside the trip
 *   - Fallback "Trip PIC" / "Co-PIC" badge when no bus/sport involvement
 */
export function OutdoorCcaCard({ activity, onClick, isUpcoming = false }: OutdoorCcaCardProps) {
  const bucketPill = getCcaTypePillColor(activity.kind ?? activity.category);

  const buses = activity.outdoorBusRoles ?? [];
  const sports = activity.outdoorSportRoles ?? [];
  const allSports = activity.outdoorAllSports ?? [];
  const myLeadIds = new Set(sports.map((s) => s.sportActivityId));
  const isTripPic =
    activity.myRole === "pic" || activity.myRole === "co-pic";

  const dateLabel = activity.nextSessionDate
    ? format(parseISO(activity.nextSessionDate), "d MMM yyyy")
    : null;
  const titleLabel = dateLabel ? `${dateLabel} · Outdoor` : "Outdoor Trip";

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all active:scale-[0.99] bg-card border-border hover:shadow-md",
        isUpcoming && "bg-amber-50 border-amber-200 ring-1 ring-amber-200"
      )}
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
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {isUpcoming ? (
            <Badge className="bg-amber-400 text-amber-950 shadow-md border-0">
              Upcoming
            </Badge>
          ) : (
            <div />
          )}
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

        {/* All sports tagged in this trip (everyone sees the same list) */}
        {allSports.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Sports
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allSports.map((s) => {
                const mine = myLeadIds.has(s.sportActivityId);
                return (
                  <Badge
                    key={s.sportActivityId}
                    variant="outline"
                    className={cn(
                      "border",
                      mine
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-muted/40 text-foreground border-border"
                    )}
                  >
                    {s.sportName}
                    {mine && <span className="ml-1 text-[10px] opacity-80">· PIC</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Role chips (buses / fallback trip PIC) */}
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