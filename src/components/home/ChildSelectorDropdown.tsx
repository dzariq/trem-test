import { ChevronDown } from "lucide-react";
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
}

export function ChildSelectorDropdown({ className }: ChildSelectorDropdownProps) {
  const {
    linkedStudents,
    loading,
    error,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  if (loading) {
    return (
      <div className={`h-8 px-3 flex items-center text-sm text-muted-foreground ${className || ""}`}>
        Loading...
      </div>
    );
  }

  if (error || linkedStudents.length === 0) {
    return (
      <div className={`h-8 px-3 flex items-center text-sm text-muted-foreground ${className || ""}`}>
        No students
      </div>
    );
  }

  // If only one student, just show their name without dropdown
  if (linkedStudents.length === 1) {
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
      <SelectTrigger className={`w-auto min-w-[100px] max-w-[160px] h-8 text-sm border-0 bg-transparent shadow-none focus:ring-0 ${className || ""}`}>
        <SelectValue placeholder="Select child">
          <span className="truncate">
            {selectedStudent?.name?.split(" ")[0] || "Select"}
          </span>
        </SelectValue>
      </SelectTrigger>
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
