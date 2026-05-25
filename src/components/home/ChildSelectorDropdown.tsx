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
}

export function ChildSelectorDropdown({ className, variant = "compact" }: ChildSelectorDropdownProps) {
  const {
    linkedStudents,
    loading,
    error,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  const isBar = variant === "bar";

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
      value={selectedStudentId}
      onValueChange={setSelectedStudentId}
    >
      {isBar ? (
        <SelectTrigger className={`h-10 w-full text-sm ${className || ""}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select child">
              <span className="truncate">{selectedStudent?.name || "Select child"}</span>
            </SelectValue>
          </div>
        </SelectTrigger>
      ) : (
        <SelectTrigger className={`w-auto min-w-[100px] max-w-[160px] h-8 text-sm border-0 bg-transparent shadow-none focus:ring-0 ${className || ""}`}>
          <SelectValue placeholder="Select child">
            <span className="truncate">
              {selectedStudent?.name?.split(" ")[0] || "Select"}
            </span>
          </SelectValue>
        </SelectTrigger>
      )}
      <SelectContent className="bg-card border-border">
        {linkedStudents.map((student) => (
          <SelectItem key={student.id} value={student.id}>
            <span className="truncate">{student.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
