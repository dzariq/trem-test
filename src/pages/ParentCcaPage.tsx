import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Users as UsersIcon, MapPin, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CcaActivityImage } from "@/components/cca/CcaActivityImage";
import { getCcaBucket, getCcaBucketIcon, getCcaTypePillColor } from "@/components/cca/CcaTypeTabs";
import { CCA_BUCKET_LABEL } from "@/lib/ccaSessionFormat";
import { useStudentCcaEnrollments } from "@/hooks/useStudentCcaEnrollments";
import { useStudentSelection } from "@/contexts/StudentSelectionContext";
import { ChildSelectorDropdown } from "@/components/home/ChildSelectorDropdown";
import { cn } from "@/lib/utils";

const UPCOMING_WINDOW_DAYS = 7;
function isUpcomingDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff >= 0 && diff <= UPCOMING_WINDOW_DAYS;
}

export default function ParentCcaPage() {
  const navigate = useNavigate();
  const { selectedStudentId, selectedStudent } = useStudentSelection();
  const { enrollments, loading } = useStudentCcaEnrollments({
    studentId: selectedStudentId || null,
  });

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-pt">
        <div className="w-full flex items-center gap-2 px-2 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/parent")}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground truncate">
            My CCAs
          </h1>
        </div>
        <div className="px-4 pb-3 pt-1 border-t border-border/60 bg-gradient-to-r from-primary/15 via-primary/5 to-background">
          <ChildSelectorDropdown variant="bar" />
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        )}

        {!loading && enrollments.length === 0 && (
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <UsersIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
              {selectedStudent?.name || "This student"} isn't enrolled in any CCAs yet.
            </CardContent>
          </Card>
        )}

        {!loading && enrollments.length > 0 && (
          <ul className="space-y-3">
            {enrollments.map((e) => {
              const bucket = getCcaBucket(e.kind ?? e.category);
              const BucketIcon = getCcaBucketIcon(bucket);
              const bucketLabel = CCA_BUCKET_LABEL[bucket];
              const pill = getCcaTypePillColor(e.kind ?? e.category);
              const upcoming = isUpcomingDate(e.nextSessionDate);
              return (
                <li key={e.enrollmentId}>
                  <Link
                    to={`/parent/cca/${e.activityId}`}
                    className={cn(
                      "block rounded-xl overflow-hidden border shadow-sm active:scale-[0.99] transition",
                      upcoming
                        ? "bg-amber-50 border-amber-200 ring-1 ring-amber-200"
                        : "bg-card border-border"
                    )}
                  >
                    <CcaActivityImage
                      imageUrl={e.imageUrl}
                      activityName={e.name}
                      category={e.category}
                      typeName={e.typeName}
                      variant="details"
                    />
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground leading-tight">
                          {e.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(pill, "border gap-1 text-[10px] shrink-0")}
                        >
                          <BucketIcon className="h-3 w-3" />
                          {bucketLabel}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {(e.meetingDay || e.meetingTime) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {e.meetingDay}
                            {e.meetingTime ? `, ${e.meetingTime}` : ""}
                          </span>
                        )}
                        {e.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {e.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}