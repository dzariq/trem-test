import { useState } from "react";
import { students } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface StudentPillSelectorProps {
  onStudentChange?: (studentId: string) => void;
}

export function StudentPillSelector({ onStudentChange }: StudentPillSelectorProps) {
  const [selectedId, setSelectedId] = useState(students[0].id);

  const handleSelect = (studentId: string) => {
    setSelectedId(studentId);
    onStudentChange?.(studentId);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -my-1">
      {students.map((student) => {
        const isSelected = student.id === selectedId;
        return (
          <button
            key={student.id}
            onClick={() => handleSelect(student.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 shrink-0",
              isSelected
                ? "bg-primary/10 border border-primary/30 shadow-sm"
                : "bg-muted/50 border border-transparent hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isSelected ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {student.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p
                className={cn(
                  "text-sm font-medium leading-tight truncate",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {student.name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {student.class}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
