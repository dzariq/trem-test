import { useState } from "react";
import { students } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface StudentPillSelectorProps {
  onStudentChange?: (studentId: string) => void;
}

const avatarColors = [
  "bg-gradient-to-br from-blue-400 to-blue-600",
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-purple-400 to-purple-600",
  "bg-gradient-to-br from-pink-400 to-pink-600",
  "bg-gradient-to-br from-orange-400 to-orange-600",
];

export function StudentPillSelector({ onStudentChange }: StudentPillSelectorProps) {
  const [selectedId, setSelectedId] = useState(students[0].id);
  const [open, setOpen] = useState(false);

  const handleSelect = (studentId: string) => {
    setSelectedId(studentId);
    onStudentChange?.(studentId);
    setOpen(false);
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('');

  const maxVisible = 4;
  const visibleStudents = students.slice(0, maxVisible);
  const overflowCount = students.length - maxVisible;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center -space-x-2 hover:opacity-90 transition-opacity">
          {visibleStudents.map((student, index) => (
            <div
              key={student.id}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background",
                avatarColors[index % avatarColors.length]
              )}
              style={{ zIndex: visibleStudents.length - index }}
            >
              <span className="text-xs font-semibold text-white">
                {getInitials(student.name)}
              </span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background bg-muted"
              style={{ zIndex: 0 }}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                +{overflowCount}
              </span>
            </div>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Select Child</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 pb-4">
          {students.map((student, index) => {
            const isSelected = student.id === selectedId;
            return (
              <button
                key={student.id}
                onClick={() => handleSelect(student.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    avatarColors[index % avatarColors.length]
                  )}
                >
                  <span className="text-base font-semibold text-white">
                    {getInitials(student.name)}
                  </span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.class}</p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
