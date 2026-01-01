import { useState, useRef } from "react";
import { students } from "@/data/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudentPillSelectorProps {
  onStudentChange?: (studentId: string) => void;
}

export function StudentPillSelector({ onStudentChange }: StudentPillSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentStudent = students[currentIndex];
  const hasMultiple = students.length > 1;

  const goToPrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : students.length - 1;
    setCurrentIndex(newIndex);
    onStudentChange?.(students[newIndex].id);
  };

  const goToNext = () => {
    const newIndex = currentIndex < students.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onStudentChange?.(students[newIndex].id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-1"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {hasMultiple && (
        <button
          onClick={goToPrev}
          className="p-0.5 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Previous student"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 min-w-0">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary-foreground">
            {currentStudent.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">
            {currentStudent.name}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {currentStudent.class}
          </p>
        </div>
      </div>

      {hasMultiple && (
        <button
          onClick={goToNext}
          className="p-0.5 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Next student"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {hasMultiple && (
        <div className="flex gap-1 ml-1">
          {students.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
