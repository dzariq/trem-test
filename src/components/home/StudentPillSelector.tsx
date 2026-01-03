import { useState } from "react";
import { students, SportsHouse } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Utensils, Flag, Check, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

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

const sportsHouseColors: Record<SportsHouse, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-red-500", text: "text-white", label: "Red House" },
  blue: { bg: "bg-blue-500", text: "text-white", label: "Blue House" },
  green: { bg: "bg-green-500", text: "text-white", label: "Green House" },
  yellow: { bg: "bg-yellow-400", text: "text-yellow-900", label: "Yellow House" },
};

export function StudentPillSelector({ onStudentChange }: StudentPillSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = (studentId: string) => {
    setExpandedId(expandedId === studentId ? null : studentId);
    onStudentChange?.(studentId);
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('');

  const maxVisible = 4;
  const visibleStudents = students.slice(0, maxVisible);
  const overflowCount = students.length - maxVisible;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
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
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Your Children</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2 overflow-y-auto">
          {students.map((student, index) => {
            const isExpanded = student.id === expandedId;
            const houseInfo = sportsHouseColors[student.sportsHouse];
            
            return (
              <div
                key={student.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => handleToggleExpand(student.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 transition-colors",
                    isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
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
                    <p className="text-sm text-muted-foreground">{student.class} • {student.grade}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                    <div className="space-y-4">
                      {/* Student Options */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Meal Plan */}
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background border border-border">
                          <Utensils className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Meal Plan</span>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            student.mealPlan ? "bg-green-500" : "bg-muted"
                          )}>
                            {student.mealPlan ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {/* Sports House */}
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background border border-border">
                          <Flag className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Sports House</span>
                          <Badge className={cn("text-xs px-2", houseInfo.bg, houseInfo.text)}>
                            {houseInfo.label.split(' ')[0]}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Subjects */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {student.subjects?.map((subject) => (
                            <Badge 
                              key={subject} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
