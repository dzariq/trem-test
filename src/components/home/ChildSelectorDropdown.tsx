import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentSelection } from "@/hooks/useStudentSelection";

interface ChildSelectorDropdownProps {
  className?: string;
  /** "compact" = small inline trigger (header). "bar" = full-width prominent row. */
  variant?: "compact" | "bar";
  /** Controlled scope value ("all" | studentId). When provided, the component
   *  is controlled and ignores the global selectedStudentId. */
  scopeValue?: string;
  onScopeChange?: (value: string) => void;
  /** Show an "All Children (N)" option above per-child items. */
  showAllOption?: boolean;
  /** Append "(N)" to the All Children label. Defaults to true when showAllOption is on. */
  showCount?: boolean;
}

export function ChildSelectorDropdown({
  className,
  variant = "compact",
  scopeValue,
  onScopeChange,
  showAllOption = false,
  showCount = true,
}: ChildSelectorDropdownProps) {
  const {
    linkedStudents,
    loading,
    error,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  const isBar = variant === "bar";
  const controlled = scopeValue !== undefined && !!onScopeChange;
  const currentValue = controlled ? (scopeValue as string) : selectedStudentId;
  const handleChange = (v: string) => {
    if (controlled) onScopeChange!(v);
    else setSelectedStudentId(v);
  };
  const allLabel = showCount
    ? `All Children (${linkedStudents.length})`
    : "All Children";
  const isAll = controlled && currentValue === "all";
  const activeChild = isAll
    ? null
    : linkedStudents.find((s) => s.id === currentValue) ?? selectedStudent;

  if (loading) {
    return (
      <div className={`${isBar ? "h-10 w-full" : "h-8"} px-3 flex items-center text-sm text-muted-foreground ${className || ""}`}>
        Loading...
      </div>
    );
  }

  if (error || linkedStudents.length === 0) {
    return (
      <div className={`${isBar ? "h-10 w-full" : "h-8"} px-3 flex items-center text-sm text-muted-foreground ${className || ""}`}>
        No students
      </div>
    );
  }

  // If only one student, just show their name without dropdown
  if (linkedStudents.length === 1) {
    if (isBar) {
      return (
        <div className={`h-10 w-full px-3 flex items-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground ${className || ""}`}>
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">
            {selectedStudent?.name || linkedStudents[0].name}
          </span>
        </div>
      );
    }
    return (
      <div className={`h-8 px-3 flex items-center text-sm font-medium text-foreground ${className || ""}`}>
        <span className="truncate max-w-[120px]">
          {selectedStudent?.name || linkedStudents[0].name}
        </span>
      </div>
    );
  }

  return (
    <Select
      value={currentValue || (showAllOption ? "all" : "")}
      onValueChange={handleChange}
    >
      {isBar ? (
        <SelectTrigger className={`h-10 w-full text-sm ${className || ""}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select child">
              <span className="truncate">
                {isAll
                  ? allLabel
                  : activeChild?.name || (showAllOption ? allLabel : "Select child")}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
      ) : (
        <SelectTrigger className={`w-auto min-w-[100px] max-w-[160px] h-8 text-sm border-0 bg-transparent shadow-none focus:ring-0 ${className || ""}`}>
          <SelectValue placeholder="Select child">
            <span className="truncate">
              {isAll
                ? allLabel
                : activeChild?.name?.split(" ")[0] || "Select"}
            </span>
          </SelectValue>
        </SelectTrigger>
      )}
      <SelectContent className="bg-card border-border">
        {showAllOption && (
          <SelectItem value="all">
            <span className="truncate">{allLabel}</span>
          </SelectItem>
        )}
        {linkedStudents.map((student) => (
          <SelectItem key={student.id} value={student.id}>
            <span className="truncate">{student.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
