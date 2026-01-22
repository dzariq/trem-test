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
    : null;

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
      {departmentText && (
        <span className="text-xs text-muted-foreground leading-tight mt-0.5">
          {departmentText}
        </span>
      )}
    </div>
  );
}

interface PICTeachersListProps {
  teachers: Array<{
    fullName: string;
    departments: string[];
    isPrimary?: boolean;
    role?: string;
  }>;
  fallbackCoordinator?: string | null;
  className?: string;
}

export function PICTeachersList({
  teachers,
  fallbackCoordinator,
  className,
}: PICTeachersListProps) {
  // Sort: isPrimary desc, then role='PIC' first, then alphabetically by name
  const sortedTeachers = [...teachers].sort((a, b) => {
    // Primary first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    // Then role 'PIC' before other roles
    const aIsPIC = (a.role || "").toLowerCase() === "pic";
    const bIsPIC = (b.role || "").toLowerCase() === "pic";
    if (aIsPIC && !bIsPIC) return -1;
    if (!aIsPIC && bIsPIC) return 1;
    // Then alphabetically by name
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
