import { useEffect, useState } from "react";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { resolveStudentAvatars } from "@/lib/studentAvatars";
import { StudentDetailsDrawer } from "@/components/student/StudentDetailsDrawer";

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
  const [open, setOpen] = useState(false);
  const [detailsStudentId, setDetailsStudentId] = useState<string | null>(null);
  const {
    linkedStudents: students,
    loading,
    error,
    setSelectedStudentId,
  } = useStudentSelection();

  const [studentPhotos, setStudentPhotos] = useState<Record<string, string | null>>({});

  // Load saved photos from Supabase storage
  useEffect(() => {
    if (students.length === 0) return;
    let cancelled = false;
    resolveStudentAvatars(students.map((s) => s.id))
      .then((map) => {
        if (!cancelled) setStudentPhotos(map);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [students]);

  // Listen for in-tab photo change events fired by the profile page
  useEffect(() => {
    const sameTabHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { studentId: string; photoUrl: string | null }
        | undefined;
      if (!detail) return;
      setStudentPhotos((prev) => ({ ...prev, [detail.studentId]: detail.photoUrl }));
    };
    window.addEventListener("student-photo-changed", sameTabHandler);
    return () => {
      window.removeEventListener("student-photo-changed", sameTabHandler);
    };
  }, []);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    onStudentChange?.(studentId);
    setOpen(false);
    // Open the details drawer inline so the user doesn't see the
    // profile page flash underneath ("double-load" UX).
    setDetailsStudentId(studentId);
  };

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^A-Za-z]/g, "")[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("")
      .toUpperCase();

  const maxVisible = 4;
  const visibleStudents = students.slice(0, maxVisible);
  const overflowCount = Math.max(0, students.length - maxVisible);

  return (
    <>
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="flex items-center -space-x-2 hover:opacity-90 transition-opacity">
          {loading && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background bg-muted">
              <span className="text-[10px] font-semibold text-muted-foreground">...</span>
            </div>
          )}
          {!loading && visibleStudents.length === 0 && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background bg-muted">
              <span className="text-[10px] font-semibold text-muted-foreground">0</span>
            </div>
          )}
          {!loading && visibleStudents.map((student, index) => (
            <div
              key={student.id}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background",
                !studentPhotos[student.id] && avatarColors[index % avatarColors.length],
                "overflow-hidden"
              )}
              style={{ zIndex: visibleStudents.length - index }}
            >
              {studentPhotos[student.id] ? (
                <img
                  src={studentPhotos[student.id]!}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-white">
                  {getInitials(student.name)}
                </span>
              )}
            </div>
          ))}
          {!loading && overflowCount > 0 && (
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
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading students...
            </p>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive text-center py-4">
              {error}
            </p>
          )}
          {!loading && !error && students.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No linked students yet. Please contact admin.
            </p>
          )}
          {!loading && !error && students.map((student, index) => {
            return (
              <div
                key={student.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      !studentPhotos[student.id] && avatarColors[index % avatarColors.length],
                      "overflow-hidden"
                    )}
                  >
                    {studentPhotos[student.id] ? (
                      <img
                        src={studentPhotos[student.id]!}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-semibold text-white">
                        {getInitials(student.name)}
                      </span>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-foreground">{student.name}</p>
                    {(student.className || student.grade) && (
                      <p className="text-sm text-muted-foreground">
                        {[student.className, student.grade].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
    <StudentDetailsDrawer
      studentId={detailsStudentId}
      onOpenChange={(o) => { if (!o) setDetailsStudentId(null); }}
    />
    </>
  );
}
