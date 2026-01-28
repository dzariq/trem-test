import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Phone, 
  Bell, 
  LogOut, 
  ChevronRight,
  Shield,
  Pencil,
  BookOpen,
  FileText,
  KeyRound,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useMyProfile } from "@/hooks/useMyProfile";
import { updateMyProfile } from "@/data/profile";

const schoolAccounts = [
  {
    title: "Student Information System (SIS)",
    email: "teacher@sis.edu.sg",
    password: "SIS2025Teacher!",
    description: "Access student records, grades, and attendance data"
  },
  {
    title: "Learning Management System (LMS)",
    email: "teacher@lms.edu.sg",
    password: "LMS@Teacher2025",
    description: "Upload assignments, course materials, and track student progress"
  },
  {
    title: "Email & Calendar",
    email: "teacher@school.edu.sg",
    password: "School2025!",
    description: "School email, calendar, and meeting scheduling"
  },
  {
    title: "Library Portal",
    email: "teacher@library.edu.sg",
    password: "LibAccess2025",
    description: "Reserve books, access digital resources, and manage loans"
  },
  {
    title: "IT Helpdesk Portal",
    email: "teacher@support.edu.sg",
    password: "ITSupport25!",
    description: "Submit IT support tickets and track resolution status"
  }
];

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useMyProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleLogout = useCallback(async () => {
    await signOut();
    queryClient.clear();
    navigate("/", { replace: true });
  }, [signOut, queryClient, navigate]);
  
  const [formProfile, setFormProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [editForm, setEditForm] = useState(formProfile);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) return;
    const name = profile.full_name ?? "";
    const email = profile.email ?? "";
    const phone = profile.phone ?? "";
    setFormProfile({ name, email, phone });
    setEditForm({ name, email, phone });
  }, [profile, profileLoading]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updateMyProfile({
        full_name: editForm.name,
        phone: editForm.phone,
      });

      setFormProfile(editForm);
      setIsEditOpen(false);
      toast.success("Profile updated successfully");
      refetch();
    } catch (err) {
      toast.error("Unexpected error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm(formProfile);
    setIsEditOpen(true);
  };

  const displayName = profile?.full_name || profile?.email || (profileLoading ? "Loading..." : "-");
  const displayEmail = profile?.email || (profileLoading ? "Loading..." : "-");
  const displayRole = profile?.role || "Teacher";

  return (
    <TeacherAppLayout>
      <AppHeader title="Profile" showBack />

      <section className="px-4 pt-4 space-y-4">
        {profileError && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 text-sm text-destructive">
              Unable to load profile.
            </CardContent>
          </Card>
        )}

        {/* Teacher Info Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{displayRole}</p>
                {profile?.staff_id && (
                  <p className="text-xs text-muted-foreground mt-1">ID: {profile.staff_id}</p>
                )}
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
                <p className="text-sm font-medium text-foreground">{displayEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{profile?.phone || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Taught */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No subjects available.</p>
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
                <Label className="text-sm font-medium">Attendance Reminders</Label>
                <p className="text-xs text-muted-foreground">Get reminded to submit attendance</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Grade Deadlines</Label>
                <p className="text-xs text-muted-foreground">Get notified about grade submission deadlines</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Teacher Handbook */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              onClick={() => navigate("/teacher/handbook")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">Teacher Handbook</span>
                  <span className="text-xs text-muted-foreground">Summary & PDF • 2026 Edition</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              onClick={() => setIsAccountsOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-foreground block">School Accounts</span>
                  <span className="text-xs text-muted-foreground">View login credentials</span>
                </div>
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
              onClick={() => navigate("/teacher/security-privacy")}
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
          EduConnect Teacher Portal v1.0.0
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Accounts Dialog */}
      <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              School Accounts
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              {schoolAccounts.map((account, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl border border-border bg-muted/30 space-y-2"
                >
                  <h3 className="font-semibold text-foreground">{account.title}</h3>
                  <p className="text-xs text-muted-foreground">{account.description}</p>
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground font-mono">{account.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground font-mono">{account.password}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
}
