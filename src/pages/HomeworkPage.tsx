import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useStudentHomework, type HomeworkItem } from "@/hooks/useStudentHomework";
import { useMemo } from "react";

interface GroupedHomework {
  subject: string;
  items: HomeworkItem[];
}

function StatusBadge({ status }: { status: HomeworkItem["status"] }) {
  switch (status) {
    case "submitted":
      return (
        <Badge variant="secondary" className="border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      );
    case "late":
      return (
        <Badge variant="destructive" className="border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Late
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
  }
}

export default function HomeworkPage() {
  const { selectedStudentId } = useStudentSelection();
  const { homework, isLoading } = useStudentHomework(selectedStudentId);

  // Group by subject
  const grouped = useMemo<GroupedHomework[]>(() => {
    const map = new Map<string, HomeworkItem[]>();
    homework.forEach((item) => {
      const existing = map.get(item.subject) || [];
      existing.push(item);
      map.set(item.subject, existing);
    });
    return Array.from(map.entries()).map(([subject, items]) => ({
      subject,
      items: items.sort((a, b) => {
        // Sort by due date descending, nulls last
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }),
    }));
  }, [homework]);

  return (
    <AppLayout>
      <AppHeader title="Homework" showChildSelector />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
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

        {/* Grouped Homework List */}
        {!isLoading && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.subject} className="space-y-3">
                {/* Subject Header */}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {group.subject}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {group.items.length}
                  </Badge>
                </div>

                {/* Cards */}
                {group.items.map((item) => (
                  <Card key={item.id} className="border-border">
                    <CardContent className="p-4 space-y-3">
                      {/* Header: Status + Due Date */}
                      <div className="flex items-center justify-between">
                        <StatusBadge status={item.status} />
                        {item.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Due {format(parseISO(item.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      {item.title && (
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                      )}

                      {/* Instructions */}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {item.instructions}
                      </p>

                      {/* Submitted info */}
                      {item.status === "submitted" && item.submittedAt && (
                        <p className="text-xs text-muted-foreground">
                          Submitted on {format(parseISO(item.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
