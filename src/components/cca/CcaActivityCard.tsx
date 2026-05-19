import { Clock, MapPin, User, CalendarDays, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CcaActivityImage } from "./CcaActivityImage";
import { PICTeachersList } from "./PICTeacherPill";
import { getCcaBucket, getCcaBucketIcon, getCcaTypePillColor } from "./CcaTypeTabs";
import {
  CCA_BUCKET_LABEL,
  formatSessionDateShort,
  formatSessionTime,
  getNextUpcomingSession,
} from "@/lib/ccaSessionFormat";
import { cn } from "@/lib/utils";
import type { EnrolledCcaActivity } from "@/hooks/useStudentCcaEnrollments";
import type { CcaActivity } from "@/hooks/useEligibleCcaActivities";

interface CcaActivityCardProps {
  activity: EnrolledCcaActivity | CcaActivity;
  variant?: "enrolled" | "available";
  isEnrolled?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * CCA Activity Card with announcement-style layout:
 * - Hero image on top with badges overlaid
 * - Title and description below
 * - Meeting details at bottom
 * - Entire card is clickable
 */
export function CcaActivityCard({
  activity,
  variant = "available",
  isEnrolled = false,
  onClick,
  className,
}: CcaActivityCardProps) {
  const isEnrolledState = variant === "enrolled" || isEnrolled;

  // Get teacher info based on activity type
  const hasTeacherInfo = 
    ("picTeachers" in activity && activity.picTeachers.length > 0) || 
    ("coordinatorName" in activity && activity.coordinatorName);

  const bucket = getCcaBucket(activity.kind ?? activity.category);
  const BucketIcon = getCcaBucketIcon(bucket);
  const bucketLabel = CCA_BUCKET_LABEL[bucket];
  const bucketPill = getCcaTypePillColor(activity.kind ?? activity.category);

  const isEvent = bucket === "events";
  const sessions = "sessions" in activity ? activity.sessions : undefined;
  const nextSession = isEvent ? getNextUpcomingSession(sessions) : null;
  const maxParticipants = "maxParticipants" in activity ? activity.maxParticipants : null;

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all active:scale-[0.99] bg-card border-border hover:shadow-md",
        className
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
      {/* Hero Image Section */}
      <div className="relative h-36 overflow-hidden">
        <CcaActivityImage
          imageUrl={activity.imageUrl}
          activityName={activity.name}
          category={activity.category}
          typeName={activity.typeName}
          variant="details"
          isEnrolled={isEnrolledState}
          className="w-full h-full rounded-none"
        />

        {/* Overlaid Badges - positioned at top */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Enrolled Badge (left) */}
          {isEnrolledState && (
            <Badge
              className="bg-primary text-primary-foreground shadow-md"
            >
              Enrolled
            </Badge>
          )}
          {!isEnrolledState && <div />}
          
          {/* Kind Bucket Badge (right) */}
          <Badge
            className={cn(bucketPill, "border shadow-md gap-1")}
            variant="outline"
          >
            <BucketIcon className="h-3 w-3" />
            {bucketLabel}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-foreground text-base line-clamp-1">
            {activity.name}
          </h3>
          {activity.typeName && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {activity.typeName}
            </p>
          )}
          {"eligibleYears" in activity && activity.eligibleYears.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Years: {activity.eligibleYears.join(", ")}
            </p>
          )}
        </div>

        {/* Description */}
        {activity.publicDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {activity.publicDescription}
          </p>
        )}

        {/* Meeting Details */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {isEvent ? (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {nextSession
                  ? `Next: ${formatSessionDateShort(nextSession.sessionDate)}${
                      nextSession.startTime ? ` · ${formatSessionTime(nextSession.startTime)}` : ""
                    }`
                  : "Date to be announced"}
              </span>
            </div>
          ) : (
            (activity.meetingDay || activity.meetingTime) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {activity.meetingDay || "TBD"}
                {activity.meetingTime ? `, ${activity.meetingTime}` : ""}
              </span>
            </div>
            )
          )}
          {!isEvent && maxParticipants != null && maxParticipants > 0 && (
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">Up to {maxParticipants} spots</span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {hasTeacherInfo && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <PICTeachersList
                teachers={"picTeachers" in activity ? activity.picTeachers : []}
                fallbackCoordinator={"coordinatorName" in activity ? activity.coordinatorName : null}
                variant="compact"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
