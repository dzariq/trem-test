import { cn } from "@/lib/utils";

interface PICTeacherPillProps {
  name: string;
  departments: string[];
  isPrimary?: boolean;
  className?: string;
}

export function PICTeacherPill({
  name,
  departments,
  isPrimary = false,
  className,
}: PICTeacherPillProps) {
  const departmentText = departments.length > 0 
    ? departments.join(", ") 
    : "No department";

  return (
    <div
      className={cn(
        "inline-flex flex-col px-3 py-2 rounded-lg border",
        isPrimary
          ? "bg-primary/10 border-primary/30"
          : "bg-muted/50 border-border",
        className
      )}
    >
      <span className="text-sm font-semibold text-foreground leading-tight">
        {name}
        {isPrimary && (
          <span className="ml-1.5 text-xs font-normal text-primary">(Lead)</span>
        )}
      </span>
      <span className="text-xs text-muted-foreground leading-tight mt-0.5">
        {departmentText}
      </span>
    </div>
  );
}

interface PICTeachersListProps {
  teachers: Array<{
    fullName: string;
    departments: string[];
    isPrimary?: boolean;
  }>;
  fallbackCoordinator?: string | null;
  className?: string;
}

export function PICTeachersList({
  teachers,
  fallbackCoordinator,
  className,
}: PICTeachersListProps) {
  // Sort: primary teachers first, then alphabetically
  const sortedTeachers = [...teachers].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  if (sortedTeachers.length === 0) {
    // Fallback to legacy coordinator_name if no teachers assigned
    if (fallbackCoordinator) {
      return (
        <div className={cn("flex flex-wrap gap-2", className)}>
          <PICTeacherPill
            name={fallbackCoordinator}
            departments={[]}
            isPrimary={false}
          />
        </div>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">No PIC assigned</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {sortedTeachers.map((teacher, index) => (
        <PICTeacherPill
          key={index}
          name={teacher.fullName}
          departments={teacher.departments}
          isPrimary={teacher.isPrimary}
        />
      ))}
    </div>
  );
}
