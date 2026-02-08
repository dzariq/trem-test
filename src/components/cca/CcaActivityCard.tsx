import { Clock, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CcaActivityImage } from "./CcaActivityImage";
import { PICTeachersList } from "./PICTeacherPill";
import { getCcaTypeColor } from "./CcaTypeTabs";
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
  const isEnrolledVariant = variant === "enrolled";
  
  // Get teacher info based on activity type
  const hasTeacherInfo = 
    ("picTeachers" in activity && activity.picTeachers.length > 0) || 
    ("coordinatorName" in activity && activity.coordinatorName);

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all active:scale-[0.99]",
        isEnrolledVariant
          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
          : "bg-card border-border hover:bg-muted/50",
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
      <div className="relative h-32 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
        <CcaActivityImage
          imageUrl={activity.imageUrl}
          activityName={activity.name}
          category={activity.category}
          typeName={activity.typeName}
          variant="details"
          className="w-full h-full rounded-none"
        />
        
        {/* Overlaid Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Enrolled Badge (left) */}
          {(isEnrolledVariant || isEnrolled) && (
            <Badge
              className="bg-primary text-primary-foreground shadow-md"
            >
              Enrolled
            </Badge>
          )}
          {!isEnrolledVariant && !isEnrolled && <div />}
          
          {/* Category Badge (right) */}
          <Badge
            className={cn(
              getCcaTypeColor(activity.typeName || activity.category),
              "shadow-md"
            )}
            variant="secondary"
          >
            {activity.typeName || activity.category}
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
          {(activity.meetingDay || activity.meetingTime) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {activity.meetingDay || "TBD"}
                {activity.meetingTime ? `, ${activity.meetingTime}` : ""}
              </span>
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
