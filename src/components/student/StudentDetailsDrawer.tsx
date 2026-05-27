import { useEffect, useMemo, useState } from "react";
import { Loader2, X, Camera, Upload, Trash2, BookOpen, Flag, CalendarDays, School, GraduationCap, Plane, BookMarked, Globe } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CcaActivityCard } from "@/components/cca/CcaActivityCard";
import { useStudentCcaEnrollments } from "@/hooks/useStudentCcaEnrollments";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import {
  resolveStudentAvatars,
  uploadStudentAvatar,
  deleteStudentAvatar,
  compressImageFile,
} from "@/lib/studentAvatars";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const avatarColors = [
  "bg-gradient-to-br from-blue-400 to-blue-600",
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-purple-400 to-purple-600",
  "bg-gradient-to-br from-pink-400 to-pink-600",
  "bg-gradient-to-br from-orange-400 to-orange-600",
];

const sportsHouseColors: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-red-500", text: "text-white", label: "Red House" },
  blue: { bg: "bg-blue-500", text: "text-white", label: "Blue House" },
  green: { bg: "bg-green-500", text: "text-white", label: "Green House" },
  yellow: { bg: "bg-yellow-400", text: "text-yellow-900", label: "Yellow House" },
};

interface StudentDetailsDrawerProps {
  studentId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailsDrawer({ studentId, onOpenChange }: StudentDetailsDrawerProps) {
  const { linkedStudents } = useStudentSelection();
  const selectedStudent = useMemo(
    () => (studentId ? linkedStudents.find((s) => s.id === studentId) ?? null : null),
    [studentId, linkedStudents],
  );

  const [isPhotoEditOpen, setIsPhotoEditOpen] = useState(false);
  const [studentPhotos, setStudentPhotos] = useState<Record<string, string | null>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const {
    enrollments: selectedStudentEnrollments,
    loading: selectedStudentEnrollmentsLoading,
  } = useStudentCcaEnrollments({ studentId: selectedStudent?.id ?? null });

  useEffect(() => {
    if (linkedStudents.length === 0) return;
    let cancelled = false;
    resolveStudentAvatars(linkedStudents.map((s) => s.id))
      .then((map) => {
        if (!cancelled) setStudentPhotos(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [linkedStudents]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { studentId: string; photoUrl: string | null }
        | undefined;
      if (!detail) return;
      setStudentPhotos((prev) => ({ ...prev, [detail.studentId]: detail.photoUrl }));
    };
    window.addEventListener("student-photo-changed", handler);
    return () => window.removeEventListener("student-photo-changed", handler);
  }, []);

  const getStudentColorClass = (id: string) => {
    const index = linkedStudents.findIndex((s) => s.id === id);
    return avatarColors[(index >= 0 ? index : 0) % avatarColors.length];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    compressImageFile(file)
      .then((compressed) => {
        setPendingFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      })
      .catch(() => {
        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      });
  };

  const handleSavePhoto = async () => {
    if (!selectedStudent || !pendingFile) return;
    setIsSavingPhoto(true);
    try {
      const url = await uploadStudentAvatar(selectedStudent.id, pendingFile);
      setStudentPhotos((prev) => ({ ...prev, [selectedStudent.id]: url }));
      window.dispatchEvent(
        new CustomEvent("student-photo-changed", {
          detail: { studentId: selectedStudent.id, photoUrl: url },
        }),
      );
      toast.success("Photo updated successfully");
      setIsPhotoEditOpen(false);
      setPreviewUrl(null);
      setPendingFile(null);
    } catch (err) {
      console.error("Failed to upload student photo", err);
      toast.error("Could not upload photo. Please try again.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!selectedStudent) return;
    setIsSavingPhoto(true);
    try {
      await deleteStudentAvatar(selectedStudent.id);
      setStudentPhotos((prev) => ({ ...prev, [selectedStudent.id]: null }));
      window.dispatchEvent(
        new CustomEvent("student-photo-changed", {
          detail: { studentId: selectedStudent.id, photoUrl: null },
        }),
      );
      setPreviewUrl(null);
      setPendingFile(null);
      toast.success("Photo removed");
      setIsPhotoEditOpen(false);
    } catch (err) {
      console.error("Failed to remove student photo", err);
      toast.error("Could not remove photo. Please try again.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleOpenPhotoEdit = () => {
    if (!selectedStudent) return;
    setPreviewUrl(studentPhotos[selectedStudent.id] || null);
    setPendingFile(null);
    setIsPhotoEditOpen(true);
  };

  const isOpen = !!selectedStudent && !isPhotoEditOpen;

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onOpenChange(false); }}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-center relative">
            <DrawerTitle>Student Details</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 rounded-full bg-muted p-2 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DrawerClose>
          </DrawerHeader>

          {selectedStudent && (
            <div className="space-y-6 px-4 pb-4 overflow-y-auto">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  {studentPhotos[selectedStudent.id] ? (
                    <AvatarImage
                      src={studentPhotos[selectedStudent.id]!}
                      alt={selectedStudent.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className={`${getStudentColorClass(selectedStudent.id)} text-white text-3xl font-semibold`}>
                    {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-center gap-2">
                  <h3 className="text-xl font-semibold text-foreground leading-tight text-center">{selectedStudent.name}</h3>
                  {selectedStudent.studentCode && (
                    <Badge variant="outline" className="text-sm font-medium px-2.5 py-0.5 bg-muted/40 border-border text-foreground/80">
                      ID: {selectedStudent.studentCode}
                    </Badge>
                  )}
                  {selectedStudent.email && (
                    <p className="text-xs text-muted-foreground break-all text-center">{selectedStudent.email}</p>
                  )}
                </div>

                <Button variant="outline" onClick={handleOpenPhotoEdit} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Edit Photo
                </Button>
              </div>

              <Separator />

              {(selectedStudent.enrollmentDate || selectedStudent.className || selectedStudent.graduationYear) && (
                <>
                  <div className="space-y-3">
                    <span className="font-medium text-foreground">Key Information</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 text-center">Enrolled</span>
                        <span className="text-sm font-bold text-foreground text-center">
                          {selectedStudent.enrollmentDate
                            ? new Date(selectedStudent.enrollmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </div>
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-900/30 border border-pink-200/60 dark:border-pink-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <School className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300 text-center">Class</span>
                        <span className="text-sm font-bold text-foreground text-center">{selectedStudent.className ?? "—"}</span>
                      </div>
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-900/30 border border-amber-200/60 dark:border-amber-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 text-center">Graduation</span>
                        <span className="text-sm font-bold text-foreground text-center">{selectedStudent.graduationYear ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {selectedStudent.malaysianCitizen === false && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Visa & Passport</span>
                      {selectedStudent.nationality && (
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 bg-muted/40 border-border text-foreground/80 gap-1">
                          <Globe className="w-3 h-3" />
                          {selectedStudent.nationality}
                        </Badge>
                      )}
                    </div>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const formatDate = (d: string) =>
                        new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                      const daysUntil = (d?: string | null) => {
                        if (!d) return null;
                        const target = new Date(d);
                        target.setHours(0, 0, 0, 0);
                        return Math.round((target.getTime() - today.getTime()) / 86400000);
                      };
                      const visaDays = daysUntil(selectedStudent.visaExpiryDate);
                      const passportDays = daysUntil(selectedStudent.passportExpiryDate);
                      const statusFor = (days: number | null) => {
                        if (days === null) return null;
                        if (days < 0) return { label: "Expired", className: "bg-destructive/15 text-destructive border-destructive/30" };
                        if (days <= 90) return { label: `Expiring in ${days}d`, className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" };
                        return { label: "Valid", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" };
                      };
                      const visaStatus = statusFor(visaDays);
                      const passportStatus = statusFor(passportDays);
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-900/30 border border-sky-200/60 dark:border-sky-800/40">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10 shrink-0">
                              <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Visa Expiry</div>
                              <div className="text-sm font-bold text-foreground">
                                {selectedStudent.visaExpiryDate ? formatDate(selectedStudent.visaExpiryDate) : "—"}
                              </div>
                            </div>
                            {visaStatus && (
                              <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0.5 border", visaStatus.className)}>
                                {visaStatus.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-900/30 border border-violet-200/60 dark:border-violet-800/40">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10 shrink-0">
                              <BookMarked className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Passport Expiry</div>
                              <div className="text-sm font-bold text-foreground">
                                {selectedStudent.passportExpiryDate ? formatDate(selectedStudent.passportExpiryDate) : "—"}
                              </div>
                              {selectedStudent.passportNumber && (
                                <div className="text-[11px] text-muted-foreground truncate">No. {selectedStudent.passportNumber}</div>
                              )}
                            </div>
                            {passportStatus && (
                              <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0.5 border", passportStatus.className)}>
                                {passportStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <Separator />
                </>
              )}

              {selectedStudent.sportsHouse && (
                <>
                  <div className="space-y-3">
                    <span className="font-medium text-foreground">Student Options</span>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 border border-border">
                        <Flag className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground text-center">Sports House</span>
                        {sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()] ? (
                          <Badge className={cn(
                            "text-xs px-2",
                            sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].bg,
                            sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].text,
                          )}>
                            {sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].label.split(" ")[0]}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-2">{selectedStudent.sportsHouse}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">CCA Clubs & Activities</span>
                </div>
                {selectedStudentEnrollmentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading clubs...</span>
                  </div>
                ) : selectedStudentEnrollments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudentEnrollments.map((activity) => (
                      <CcaActivityCard key={activity.enrollmentId} activity={activity} variant="enrolled" />
                    ))}
                  </div>
                ) : selectedStudent.ccaActivities && selectedStudent.ccaActivities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.ccaActivities.map((cca, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">{cca.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No clubs joined</p>
                )}
              </div>
            </div>
          )}

          <DrawerFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={isPhotoEditOpen} onOpenChange={setIsPhotoEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Photo</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="flex flex-col items-center gap-6 py-6">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={selectedStudent.name} className="object-cover" />
                ) : null}
                <AvatarFallback className={`${getStudentColorClass(selectedStudent.id)} text-white text-4xl font-semibold`}>
                  {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                <p className="text-sm text-muted-foreground">Upload a photo for your child</p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload-shared"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("photo-upload-shared")?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {previewUrl ? "Change Photo" : "Upload Photo"}
                </Button>

                {(previewUrl || studentPhotos[selectedStudent.id]) && (
                  <Button
                    variant="outline"
                    onClick={handleRemovePhoto}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Accepted formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePhoto} disabled={!pendingFile || isSavingPhoto}>
              {isSavingPhoto ? "Saving..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}