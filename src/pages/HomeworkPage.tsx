import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, GraduationCap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useStudentHomework } from "@/hooks/useStudentHomework";

export default function HomeworkPage() {
  const { selectedStudentId } = useStudentSelection();
  const { homework, isLoading, studentClass } = useStudentHomework(selectedStudentId);

  return (
    <AppLayout>
      <AppHeader title="Homework" showChildSelector />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Class Info Badge */}
        {studentClass && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>Showing homework for class: <strong className="text-foreground">{studentClass}</strong></span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-sky-200 dark:border-sky-800">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && homework.length === 0 && (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Homework Assigned</h3>
              <p className="text-sm text-muted-foreground">
                There are no homework assignments for your child at the moment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Homework List */}
        {!isLoading && homework.length > 0 && (
          <div className="space-y-3">
            {homework.map((item) => (
              <Card 
                key={item.id} 
                className="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                      <BookOpen className="h-3 w-3" />
                      {item.subject}
                    </span>
                    {item.date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(item.date), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  {/* Lesson Title */}
                  <h3 className="font-medium text-foreground">{item.title}</h3>

                  {/* Homework Description */}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {item.homework}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
