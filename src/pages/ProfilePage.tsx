import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { parentProfile, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  MapPin,
  FileText,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: parentProfile.name,
    email: parentProfile.email,
    phone: parentProfile.phone,
  });
  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditOpen(false);
    toast.success("Profile updated successfully");
  };

  const handleOpenEdit = () => {
    setEditForm(profile);
    setIsEditOpen(true);
  };

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
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">Parent / Guardian</p>
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
                <p className="text-sm font-medium text-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{profile.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Students */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Linked Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.map((student, index) => {
              const avatarColors = [
                "bg-gradient-to-br from-blue-400 to-blue-600",
                "bg-gradient-to-br from-teal-400 to-teal-600",
                "bg-gradient-to-br from-purple-400 to-purple-600",
                "bg-gradient-to-br from-pink-400 to-pink-600",
                "bg-gradient-to-br from-orange-400 to-orange-600",
              ];
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border"
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${avatarColors[index % avatarColors.length]}`}>
                    <span className="text-base font-semibold text-white">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.class} • {student.grade}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
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

        {/* Resources - Student Handbook */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
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
              onClick={() => navigate("/security-privacy")}
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
          onClick={() => navigate("/")}
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
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        pdfUrl="/documents/student-handbook.pdf"
        title="Student Handbook"
        downloadFileName="Student_Handbook_2026.pdf"
      />
    </AppLayout>
  );
}
