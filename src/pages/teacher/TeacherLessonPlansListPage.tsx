import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import schoolLogo from "@/assets/school-badge.png";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, ChevronRight, Users, Loader2 } from "lucide-react";
import { useTeacherAssignedPlans } from "@/hooks/useTeacherLessonPlans";
import { getAcademicYears } from "@/data/weekConfigData";
import { cn } from "@/lib/utils";

const LS_TEACHER_LP_YEAR = "teacherLP_selectedYear";
const LS_TEACHER_LP_YEAR_LEVEL = "teacherLP_selectedYearLevel";
const LS_TEACHER_LP_SUBJECT = "teacherLP_selectedSubject";

const TeacherLessonPlansListPage = () => {
  const navigate = useNavigate();
  const academicYears = getAcademicYears();

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem(LS_TEACHER_LP_YEAR) || academicYears[0]?.id || "";
  });
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>(() => {
    return localStorage.getItem(LS_TEACHER_LP_YEAR_LEVEL) || "";
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return localStorage.getItem(LS_TEACHER_LP_SUBJECT) || "";
  });

  // Fetch assigned plans
  const { plans, loading, error } = useTeacherAssignedPlans(
    selectedYear ? parseInt(selectedYear) : undefined,
    selectedYearLevel || undefined,
    selectedSubject || undefined
  );

  // Get unique year levels and subjects from plans for filter options
  const yearLevels = Array.from(new Set(plans.map(p => p.yearLevel).filter(Boolean))).sort();
  const subjects = Array.from(new Set(plans.map(p => p.subject))).sort();

  // Persist filter selections
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    localStorage.setItem(LS_TEACHER_LP_YEAR, year);
  };

  const handleYearLevelChange = (level: string) => {
    setSelectedYearLevel(level);
    localStorage.setItem(LS_TEACHER_LP_YEAR_LEVEL, level);
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    localStorage.setItem(LS_TEACHER_LP_SUBJECT, subject);
  };

  const handlePlanClick = (planId: string) => {
    navigate(`/teacher/lesson-plans/${planId}`);
  };

  return (
    <TeacherAppLayout>
      <AppHeader
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Lesson Plans</h1>
          </div>
        }
      />

      <div className="flex flex-col h-full min-h-0">
        {/* Filters */}
        <div className="px-4 py-3 border-b border-border bg-card/50 space-y-2">
          <div className="flex items-center gap-2">
            {/* Year Selector */}
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Level Filter */}
            <Select value={selectedYearLevel} onValueChange={handleYearLevelChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {yearLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plans List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No lesson plans assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact your administrator to be assigned to lesson plans.
              </p>
            </div>
          ) : (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
                onClick={() => handlePlanClick(plan.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{plan.subject}</h3>
                      <p className="text-xs text-muted-foreground">
                        {plan.yearLevel} • {plan.academicYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.assignedClasses.length > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Users className="h-3 w-3" />
                          {plan.assignedClasses.length}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </TeacherAppLayout>
  );
};

export default TeacherLessonPlansListPage;
