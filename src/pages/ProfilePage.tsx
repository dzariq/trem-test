import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { 
  Mail, 
  Phone, 
  Bell, 
  LogOut, 
  ChevronRight,
  Shield,
  Pencil,
  MapPin,
  FileText,
  IdCard,
  Eye,
  Camera,
  Upload,
  Trash2,
  BookOpen,
  Utensils,
  Flag,
  CalendarDays,
  School,
  GraduationCap,
  Check,
  X
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { HandbookReportDialog } from "@/components/HandbookReportDialog";
import { studentHandbookData } from "@/data/studentHandbookData";
import { cn } from "@/lib/utils";
import { useMyProfile } from "@/hooks/useMyProfile";
import { type LinkedStudent } from "@/data/students";
import { updateMyProfile } from "@/data/profile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import {
  resolveStudentAvatars,
  uploadStudentAvatar,
  deleteStudentAvatar,
  compressImageFile,
} from "@/lib/studentAvatars";

const sportsHouseColors: Record<string, { bg: string; text: string; label: string }> = {
  red: { bg: "bg-red-500", text: "text-white", label: "Red House" },
  blue: { bg: "bg-blue-500", text: "text-white", label: "Blue House" },
  green: { bg: "bg-green-500", text: "text-white", label: "Green House" },
  yellow: { bg: "bg-yellow-400", text: "text-yellow-900", label: "Yellow House" },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useMyProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  
  const handleLogout = useCallback(async () => {
    await signOut();
    queryClient.clear();
    navigate("/", { replace: true });
  }, [signOut, queryClient, navigate]);
  const [isTimetablePdfOpen, setIsTimetablePdfOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);
  const [isPhotoEditOpen, setIsPhotoEditOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formProfile, setFormProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editForm, setEditForm] = useState(formProfile);
  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
  } = useStudentSelection();
  
  // State for student photos
  const [studentPhotos, setStudentPhotos] = useState<Record<string, string | null>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Load saved photos from Supabase storage when students load
  useEffect(() => {
    if (linkedStudents.length === 0) return;
    let cancelled = false;
    resolveStudentAvatars(linkedStudents.map((s) => s.id))
      .then((map) => {
        if (!cancelled) setStudentPhotos(map);
      })
      .catch(() => {
        // ignore — fall back to initials
      });
    return () => {
      cancelled = true;
    };
  }, [linkedStudents]);

  // Auto-open the student details drawer when navigated with ?studentId=
  useEffect(() => {
    const targetId = searchParams.get("studentId");
    if (!targetId || linkedStudents.length === 0) return;
    const match = linkedStudents.find((s) => s.id === targetId);
    if (match) {
      setSelectedStudent(match);
      if (match.id !== selectedStudentId) {
        setSelectedStudentId(match.id);
      }
      // Clear the param so the drawer can be closed normally
      const next = new URLSearchParams(searchParams);
      next.delete("studentId");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, linkedStudents, selectedStudentId, setSelectedStudentId, setSearchParams]);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) return;
    const name = profile.full_name ?? "";
    const email = profile.email ?? "";
    const phone = profile.phone ?? "";
    setFormProfile({ name, email, phone });
    setEditForm({ name, email, phone });
  }, [profile, profileLoading]);

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

    // Compress for upload, show local preview from the compressed file
    compressImageFile(file)
      .then((compressed) => {
        setPendingFile(compressed);
        const objectUrl = URL.createObjectURL(compressed);
        setPreviewUrl(objectUrl);
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
    if (selectedStudent) {
      setPreviewUrl(studentPhotos[selectedStudent.id] || null);
      setPendingFile(null);
      setIsPhotoEditOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateMyProfile({
        full_name: editForm.name,
        phone: editForm.phone,
      });
      setFormProfile(editForm);
      setIsEditOpen(false);
      toast.success("Profile updated successfully");
      refetch();
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleOpenEdit = () => {
    setEditForm(formProfile);
    setIsEditOpen(true);
  };

  const avatarColors = [
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
  ];

  const getStudentColorClass = (studentId: string) => {
    const index = linkedStudents.findIndex(s => s.id === studentId);
    return avatarColors[index % avatarColors.length];
  };

  const displayName = profile?.full_name || profile?.email || (profileLoading ? "Loading..." : "-");
  const displayEmail = profile?.email || (profileLoading ? "Loading..." : "-");
  const displayInitials = (displayName || "User")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("");
  const displayRole = profile?.role
    ? `${profile.role.charAt(0).toUpperCase()}${profile.role.slice(1)}`
    : "Parent / Student";

  return (
    <AppLayout>
      <AppHeader title="Profile" showBack />

      <section className="px-4 pt-4 space-y-4">
        {/* Parent Info Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground">{displayRole}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleOpenEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {displayEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.phone || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <IdCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground">
                  {displayRole}
                </p>
              </div>
            </div>
            {profileError && (
              <p className="text-xs text-destructive">
                Unable to load profile details.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Linked Students */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Linked Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {studentsLoading && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Loading linked students...
              </p>
            )}
            {!studentsLoading && studentsError && (
              <p className="text-sm text-destructive text-center py-2">
                {studentsError}
              </p>
            )}
            {!studentsLoading && !studentsError && linkedStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No linked students yet. Please contact admin.
              </p>
            )}
            {!studentsLoading && !studentsError && linkedStudents.map((student, index) => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  if (student.id !== selectedStudentId) {
                    setSelectedStudentId(student.id);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/30 transition-colors text-left"
              >
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                  {studentPhotos[student.id] ? (
                    <AvatarImage src={studentPhotos[student.id]!} alt={student.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className={`${avatarColors[index % avatarColors.length]} text-white text-base font-semibold`}>
                    {student.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{student.name}</h3>
                  {(student.className || student.grade) && (
                    <p className="text-sm text-muted-foreground">
                      {[student.className, student.grade].filter(Boolean).join(" - ")}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive app notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive email updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Attendance Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified about absences</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Grade Updates</Label>
                <p className="text-xs text-muted-foreground">Get notified about new grades</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Resources - Student Handbook & Timetable */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors border-b border-border"
              onClick={() => setIsPdfOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">Student Handbook</span>
                  <span className="text-xs text-muted-foreground">PDF • 2026 Edition</span>
                </div>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </button>
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              onClick={() => setIsTimetablePdfOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">Student Timetable</span>
                  <span className="text-xs text-muted-foreground">PDF • 2026 Edition</span>
                </div>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Contact Us */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              onClick={() => navigate("/parent/contact")}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Contact Us</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              onClick={() => navigate("/parent/security-privacy")}
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Security & Privacy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          EduConnect Parent Portal v1.0.0
        </p>
      </section>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? editForm.email}
                disabled
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={editForm.phone}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9+ ]/g, "");
                  setEditForm({ ...editForm, phone: sanitized });
                }}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handbook & Timetable Report Dialogs */}
      <HandbookReportDialog
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        title="Student Handbook"
        subtitle={`Academic Year ${studentHandbookData.academic_year}`}
        sections={studentHandbookData.sections.map(s => ({
          title: s.title,
          items: s.subsections.map(sub => ({ heading: sub.subtitle, points: sub.points })),
        }))}
        downloadFileName="Student_Handbook_2026.pdf"
        originalPdfUrl="/documents/student-handbook.pdf"
      />
      <HandbookReportDialog
        open={isTimetablePdfOpen}
        onOpenChange={setIsTimetablePdfOpen}
        title="Student Timetable"
        subtitle="Academic Year 2026"
        sections={[{
          title: "Weekly Timetable",
          items: [
            { heading: "Note", points: ["The student timetable is currently being updated. Please contact the school office for the latest version."] },
          ],
        }]}
        downloadFileName="Student_Timetable_2026.pdf"
        originalPdfUrl="/documents/student-timetable.pdf"
      />

      {/* Student Details Drawer - Mobile friendly with drag to close */}
      <Drawer open={!!selectedStudent && !isPhotoEditOpen} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-center relative">
            <DrawerTitle>Student Details</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 rounded-full bg-muted p-2 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </DrawerClose>
          </DrawerHeader>
          
          {selectedStudent && (
            <div className="space-y-6 px-4 pb-4 overflow-y-auto">
              {/* Student Avatar & Info */}
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
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground">{selectedStudent.name}</h3>
                  {(selectedStudent.className || selectedStudent.grade) && (
                    <p className="text-sm text-muted-foreground">
                      {[selectedStudent.className, selectedStudent.grade].filter(Boolean).join(" - ")}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleOpenPhotoEdit}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Edit Photo
                </Button>
              </div>

              <Separator />

              {/* CCA Clubs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">CCA Clubs</span>
                </div>
                {Array.isArray(selectedStudent.ccaActivities) && selectedStudent.ccaActivities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.ccaActivities.map((cca, idx) => (
                      <Badge key={`${cca.name}-${idx}`} variant="secondary" className="text-sm">
                        {cca.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No clubs joined</p>
                )}
              </div>

              <Separator />

              {/* Key Dates - Enrollment, Class, Graduation */}
              {(selectedStudent.enrollmentDate || selectedStudent.className || selectedStudent.graduationYear) && (
                <>
                  <div className="space-y-3">
                    <span className="font-medium text-foreground">Key Dates</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 text-center">Enrolled</span>
                        <span className="text-sm font-bold text-foreground text-center">
                          {selectedStudent.enrollmentDate
                            ? new Date(selectedStudent.enrollmentDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-900/30 border border-pink-200/60 dark:border-pink-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <School className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300 text-center">Class</span>
                        <span className="text-sm font-bold text-foreground text-center">
                          {selectedStudent.className ?? "—"}
                        </span>
                      </div>
                      <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-900/30 border border-amber-200/60 dark:border-amber-800/40 shadow-sm overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md ring-2 ring-white/60 dark:ring-white/10">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 text-center">Graduation</span>
                        <span className="text-sm font-bold text-foreground text-center">
                          {selectedStudent.graduationYear ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Student Options - Meal Plan, Sports House */}
              {(typeof selectedStudent.mealPlan === "boolean" || selectedStudent.sportsHouse) && (
                <div className="space-y-3">
                  <span className="font-medium text-foreground">Student Options</span>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Meal Plan */}
                    {typeof selectedStudent.mealPlan === "boolean" && (
                      <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 border border-border">
                        <Utensils className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground text-center">Meal Plan</span>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          selectedStudent.mealPlan ? "bg-green-500" : "bg-muted"
                        )}>
                          {selectedStudent.mealPlan ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Sports House - always show if available */}
                    {selectedStudent.sportsHouse && (
                      <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 border border-border">
                        <Flag className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground text-center">Sports House</span>
                        {sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()] ? (
                          <Badge className={cn(
                            "text-xs px-2",
                            sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].bg,
                            sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].text
                          )}>
                            {sportsHouseColors[selectedStudent.sportsHouse.toLowerCase()].label.split(" ")[0]}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-2">
                            {selectedStudent.sportsHouse}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sports House fallback when no meal plan but has sport house */}
              {typeof selectedStudent.mealPlan !== "boolean" && selectedStudent.sportsHouse && !(typeof selectedStudent.mealPlan === "boolean" || selectedStudent.sportsHouse) && null}

              <Separator />

              {/* Clubs & Activities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Clubs & Activities</span>
                </div>
                {selectedStudent.ccaActivities && selectedStudent.ccaActivities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.ccaActivities.map((cca, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {cca.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>

              <Separator />

              {/* Student ID */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Student ID</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedStudent.studentCode || "-"}
                </p>
              </div>
            </div>
          )}

          <DrawerFooter>
            <Button onClick={() => setSelectedStudent(null)} className="w-full">Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Photo Edit Dialog */}
      <Dialog open={isPhotoEditOpen} onOpenChange={setIsPhotoEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Photo</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Preview Avatar */}
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={selectedStudent.name} className="object-cover" />
                ) : null}
                <AvatarFallback className={`${getStudentColorClass(selectedStudent.id)} text-white text-4xl font-semibold`}>
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                <p className="text-sm text-muted-foreground">Upload a photo for your child</p>
              </div>

              {/* Upload Button */}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
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
            <Button variant="outline" onClick={() => setIsPhotoEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePhoto}
              disabled={!pendingFile || isSavingPhoto}
            >
              {isSavingPhoto ? "Saving..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
