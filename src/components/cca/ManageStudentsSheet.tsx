import { useEffect, useState, useMemo } from "react";
import { stripCampusPrefix } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Loader2, UserPlus, UserMinus, AlertCircle, Ban } from "lucide-react";
import { useSessionEnrollment, type SessionStudent } from "@/hooks/useSessionEnrollment";
import { toast } from "@/hooks/use-toast";

interface ManageStudentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  activityId: string;
  activityName: string;
  sessionTitle: string;
}

/**
 * Full-height sheet for managing student enrollment in a CCA session.
 * Teachers can enroll/unenroll students they are assigned to.
 * Enforces year-level eligibility based on club configuration.
 */
export function ManageStudentsSheet({
  open,
  onOpenChange,
  sessionId,
  activityId,
  activityName,
  sessionTitle,
}: ManageStudentsSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const {
    students,
    enrollmentInfo,
    eligibilityInfo,
    loading,
    saving,
    error,
    fetchStudents,
    enrollStudent,
    unenrollStudent,
    filterStudents,
    availableClasses,
    checkStudentEligibility,
  } = useSessionEnrollment({ sessionId, activityId });

  useEffect(() => {
    if (open && sessionId) {
      fetchStudents();
    }
  }, [open, sessionId, fetchStudents]);

  // Reset filters when sheet closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setClassFilter("all");
    }
  }, [open]);

  const filteredStudents = useMemo(
    () => filterStudents(searchQuery, classFilter),
    [filterStudents, searchQuery, classFilter]
  );

  const enrolledStudents = filteredStudents.filter((s) => s.isEnrolled);
  const availableStudents = filteredStudents.filter((s) => !s.isEnrolled);

  const handleEnroll = async (student: SessionStudent) => {
    // Pass year level for eligibility check
    await enrollStudent(student.id, student.yearLevel);
  };

  const handleUnenroll = async (student: SessionStudent) => {
    await unenrollStudent(student.id);
  };

  /**
   * Handle tap on disabled enroll button - show eligibility message
   */
  const handleIneligibleTap = (student: SessionStudent) => {
    const eligibility = checkStudentEligibility(student.yearLevel);
    toast({
      title: "Not Eligible",
      description: eligibility.message || `${student.name} is not eligible for this activity`,
      variant: "destructive",
    });
  };

  // Format eligible years for display
  const eligibleYearsDisplay = eligibilityInfo.eligibleYears.length > 0
    ? eligibilityInfo.eligibleYears.join(", ")
    : null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0, 1]}
      defaultSnapPoint={1}
      title={
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span>Manage Students</span>
        </div>
      }
      description={`${activityName} - ${sessionTitle}`}
      bodyClassName="px-4 py-3 space-y-4"
    >
      {/* Enrollment Count & Eligibility Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">Enrolled Students</span>
          </div>
          <Badge
            variant={enrollmentInfo.isFull ? "destructive" : "secondary"}
            className="text-base px-3 py-1"
          >
            {enrollmentInfo.enrolledCount} / {enrollmentInfo.maxParticipants}
          </Badge>
        </div>
        
        {/* Eligible Years Badge */}
        {eligibleYearsDisplay && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <span className="text-sm text-muted-foreground">Eligible Years:</span>
            <Badge variant="outline" className="font-medium">
              {eligibleYearsDisplay}
            </Badge>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {availableClasses.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {stripCampusPrefix(cls)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading students...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* No Students */}
      {!loading && !error && students.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No students assigned to you</p>
          <p className="text-sm">Students from your assigned classes will appear here</p>
        </div>
      )}

      {/* Enrolled Students Section */}
      {!loading && !error && enrolledStudents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Enrolled ({enrolledStudents.length})
          </p>
          {enrolledStudents.map((student) => (
            <Card key={student.id} className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stripCampusPrefix(student.class)}</span>
                      <span>•</span>
                      <span>{student.yearLevel}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleUnenroll(student)}
                    disabled={saving}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unenroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Students Section */}
      {!loading && !error && availableStudents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Available ({availableStudents.length})
          </p>
          {availableStudents.map((student) => {
            const isEligible = student.isEligible;
            const isFull = enrollmentInfo.isFull;
            const canEnroll = isEligible && !isFull;

            return (
              <Card 
                key={student.id} 
                className={`border-border ${!isEligible ? 'bg-muted/30 opacity-75' : 'bg-card'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{student.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{student.class}</span>
                        <span>•</span>
                        <span>{student.yearLevel}</span>
                        {!isEligible && (
                          <>
                            <span>•</span>
                            <span className="text-destructive font-medium flex items-center gap-1">
                              <Ban className="h-3 w-3" />
                              Not eligible
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isFull ? (
                      <Badge variant="secondary" className="flex-shrink-0">
                        Full
                      </Badge>
                    ) : !isEligible ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 text-muted-foreground border-muted"
                        onClick={() => handleIneligibleTap(student)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ineligible
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => handleEnroll(student)}
                        disabled={saving}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Enroll
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No matching students */}
      {!loading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No students match your search</p>
        </div>
      )}
    </BottomSheet>
  );
}
