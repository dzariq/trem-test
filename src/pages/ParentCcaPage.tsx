import { useEffect, useState } from "react";
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
  const { linkedStudents, selectedStudentId, selectedStudent } = useStudentSelection();
  const isMultiChild = linkedStudents.length > 1;
  const [scope, setScope] = useState<string>(isMultiChild ? "all" : selectedStudentId || "");

  useEffect(() => {
    if (isMultiChild) {
      setScope((prev) =>
        prev === "all" || linkedStudents.some((s) => s.id === prev) ? prev : "all"
      );
    } else {
      setScope(selectedStudentId || "");
    }
  }, [isMultiChild, linkedStudents, selectedStudentId]);

  const isAllScope = isMultiChild && scope === "all";
  const hookStudentId: string | string[] | null = isAllScope
    ? linkedStudents.map((s) => s.id)
    : scope || null;

  const { enrollments, loading } = useStudentCcaEnrollments({
    studentId: hookStudentId,
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
        <div
          className="px-4 pb-3 pt-1 border-t border-border/60"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(45 85% 58% / 0.22), hsl(45 85% 58% / 0.08), hsl(var(--background)))",
          }}
        >
          <ChildSelectorDropdown
            variant="bar"
            scopeValue={isMultiChild ? scope : selectedStudentId}
            onScopeChange={setScope}
            showAllOption={isMultiChild}
          />
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
              {isAllScope
                ? "None of your children are enrolled in any CCAs yet."
                : `${selectedStudent?.name || "This student"} isn't enrolled in any CCAs yet.`}
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
              const childNames = (e.enrolledStudents || [])
                .map((s) => s.name?.split(" ")[0] || "")
                .filter(Boolean);
              const showChildTag = isAllScope && childNames.length > 0;
              const childLabel =
                childNames.length <= 2
                  ? childNames.join(", ")
                  : `${childNames.slice(0, 2).join(", ")} +${childNames.length - 2}`;
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
                      {showChildTag && (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] border-border bg-secondary/40 text-foreground w-fit"
                        >
                          <UsersIcon className="h-3 w-3" />
                          {childLabel}
                        </Badge>
                      )}
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