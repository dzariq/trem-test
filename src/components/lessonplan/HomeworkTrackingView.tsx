import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, ClipboardX, Loader2 } from "lucide-react";
import { HomeworkTrackingCard } from "./HomeworkTrackingCard";
import { useClassStudents, useHomeworkSubmissions, type LessonWithHomework } from "@/hooks/useHomeworkTracking";
import type { LessonDetail, LessonTopic, LessonWeek } from "@/hooks/useTeacherLessonPlans";

interface HomeworkTrackingViewProps {
  lessonPlanId: string;
  topics: LessonTopic[];
  classYearId: number | undefined;
  getWeeksForTopic: (topicId: string) => LessonWeek[];
  getLessonsForWeek: (weekId: string) => LessonDetail[];
  isLessonsLoaded: (weekId: string) => boolean;
  onWeekToggle: (weekId: string) => void;
}

export function HomeworkTrackingView({
  lessonPlanId,
  topics,
  classYearId,
  getWeeksForTopic,
  getLessonsForWeek,
  isLessonsLoaded,
  onWeekToggle,
}: HomeworkTrackingViewProps) {
  const { students, loading: studentsLoading } = useClassStudents(classYearId);
  const {
    assignmentMap,
    loading: submissionsLoading,
    saving,
    toggleSubmission,
    getSubmissionStatus,
    getSubmissionCount,
  } = useHomeworkSubmissions(lessonPlanId, classYearId);

  // Collect all lessons with homework across all topics and weeks
  const lessonsWithHomework = useMemo(() => {
    const result: LessonWithHomework[] = [];

    topics.forEach((topic) => {
      const weeks = getWeeksForTopic(topic.id);
      weeks.forEach((week) => {
        if (!isLessonsLoaded(week.id)) {
          onWeekToggle(week.id);
          return;
        }

        const lessons = getLessonsForWeek(week.id);
        lessons.forEach((lesson) => {
          if (lesson.homework && lesson.homework.trim()) {
            const homeworkAssignmentId = assignmentMap.get(lesson.id) || "";
            result.push({
              lesson,
              topicTitle: topic.title,
              weekNumber: week.weekNumber,
              weekTitle: week.title,
              homeworkAssignmentId,
            });
          }
        });
      });
    });

    return result;
  }, [topics, getWeeksForTopic, getLessonsForWeek, isLessonsLoaded, onWeekToggle, assignmentMap]);

  if (!classYearId) {
    return (
      <div className="text-center py-12">
        <ListChecks className="h-12 w-12 mx-auto text-sky-400/50 mb-3" />
        <p className="text-muted-foreground">Select a class from the header to track homework</p>
      </div>
    );
  }

  if (studentsLoading || submissionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-sm text-muted-foreground">Loading homework data...</p>
      </div>
    );
  }

  if (lessonsWithHomework.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardX className="h-12 w-12 mx-auto text-sky-400/50 mb-3" />
        <p className="text-muted-foreground">No homework assigned yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign homework in the "Assign" tab first
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardX className="h-12 w-12 mx-auto text-sky-400/50 mb-3" />
        <p className="text-muted-foreground">No students found in this class</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="bg-sky-50/50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/50">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Tracking <span className="font-medium text-foreground">{lessonsWithHomework.length}</span> lessons with homework
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{students.length}</span> students
            </span>
          </div>
        </CardContent>
      </Card>

      {lessonsWithHomework.map((item) => (
        <HomeworkTrackingCard
          key={item.lesson.id}
          lessonWithHomework={item}
          students={students}
          saving={saving}
          onToggleSubmission={(studentId, currentStatus) =>
            toggleSubmission(item.lesson.id, studentId, currentStatus)
          }
          getSubmissionStatus={(studentId) =>
            getSubmissionStatus(item.lesson.id, studentId)
          }
          submissionCount={getSubmissionCount(item.lesson.id, students.length)}
        />
      ))}
    </div>
  );
}
