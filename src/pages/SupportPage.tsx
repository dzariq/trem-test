import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Lightbulb,
  CircleHelp,
  Star,
  Paperclip,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useStudentSelection } from "@/hooks/useStudentSelection";

type TicketType = "praise" | "suggestion" | "question" | "complaint" | null;

const ticketTypes = [
  {
    value: "praise" as const,
    label: "Praise",
    icon: Star,
    color: "bg-blue-500 text-white",
    description: "Appreciate staff or services",
  },
  {
    value: "suggestion" as const,
    label: "Suggestion",
    icon: Lightbulb,
    color: "bg-amber-500 text-white",
    description: "Share ideas for improvement",
  },
  {
    value: "question" as const,
    label: "Question",
    icon: CircleHelp,
    color: "bg-primary text-primary-foreground",
    description: "Ask about school matters",
  },
  {
    value: "complaint" as const,
    label: "Feedback",
    icon: AlertCircle,
    color: "bg-destructive text-destructive-foreground",
    description: "Share feedback or concerns",
  },
];

const getFallbackName = (email: string) => {
  const beforeAt = email.split("@")[0];
  return beforeAt || email;
};

export default function SupportPage() {
  const [selectedType, setSelectedType] = useState<TicketType>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast({
          title: "Unable to load account",
          description: error.message,
          variant: "destructive",
        });
        setProfileLoading(false);
        return;
      }
      const email = data.user?.email ?? null;
      const authId = data.user?.id ?? null;
      if (!email || !authId) {
        toast({
          title: "Missing account details",
          description: "Please sign in again to submit tickets.",
          variant: "destructive",
        });
        setProfileLoading(false);
        return;
      }
      if (!isMounted) return;
      setUserEmail(email);
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("full_name,phone")
        .eq("user_id", authId)
        .maybeSingle();

      const resolvedName =
        profileData?.full_name?.trim() || getFallbackName(email);
      const resolvedPhone = profileData?.phone ?? null;
      setParentName(resolvedName);
      setContactNumber(resolvedPhone);
      setProfileLoading(false);
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAttachmentsLabel = useMemo(() => {
    if (attachments.length === 0) return "Add files (images, PDFs)";
    if (attachments.length === 1) return attachments[0].name;
    return `${attachments.length} files selected`;
  }, [attachments]);

  const hasLinkedStudents = linkedStudents.length > 0;
  const submitDisabled =
    submitting ||
    studentsLoading ||
    profileLoading ||
    !hasLinkedStudents ||
    !selectedType ||
    !subject ||
    !description;

  const handleSubmit = async () => {
    if (!selectedType || !subject || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStudent) {
      toast({
        title: "No linked student",
        description: "Please link a student before submitting a ticket.",
        variant: "destructive",
      });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      toast({
        title: "Unable to load account",
        description: authError.message,
        variant: "destructive",
      });
      return;
    }

    const authUser = authData.user;
    const authEmail = authUser?.email ?? null;
    const authId = authUser?.id ?? null;
    if (!authEmail || !authId) {
      toast({
        title: "Missing account details",
        description: "Please sign in again to submit tickets.",
        variant: "destructive",
      });
      return;
    }

    const resolvedParentName = parentName || getFallbackName(authEmail);
    setSubmitting(true);
    const insertPayload = {
      ticket_type: selectedType,
      subject,
      description,
      parent_name: resolvedParentName,
      parent_email: authEmail,
      contact_number: contactNumber,
      student_name: selectedStudent.name ?? null,
      student_class: selectedStudent.className ?? selectedStudent.grade ?? null,
      campus: selectedStudent.campus ?? null,
      status: "new",
    };

    const { data: insertData, error: insertError } = await supabase
      .from("parent_tickets")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !insertData?.id) {
      toast({
        title: "Ticket submission failed",
        description: insertError?.message || "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const ticketId = insertData.id;
    let uploadedAttachments: Array<{ path: string; name: string; type: string; size: number }> = [];

    if (attachments.length > 0) {
      for (const file of attachments) {
        const path = `${authId}/${ticketId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("parent-ticket-attachments")
          .upload(path, file);

        if (uploadError) {
          console.error("[parent_tickets] attachment upload failed:", uploadError);
          toast({
            title: "Attachment upload failed",
            description: "Please try again.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        uploadedAttachments = [
          ...(uploadedAttachments || []),
          {
            path,
            name: file.name,
            type: file.type,
            size: file.size,
          },
        ];
      }
    }

    if (uploadedAttachments.length > 0) {
      const { error: updateError } = await supabase
        .from("parent_tickets")
        .update({ attachments: uploadedAttachments })
        .eq("id", ticketId);
      if (updateError) {
        console.error("[parent_tickets] attachments update failed:", updateError);
        toast({
          title: "Unable to save attachments",
          description: updateError.message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }

    setNewTicketId(ticketId);
    setShowSuccess(true);
    setSelectedType(null);
    setSubject("");
    setDescription("");
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSubmitting(false);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
  };

  const summaryParent = parentName && userEmail
    ? `${parentName} (${userEmail})`
    : userEmail
    ? `${getFallbackName(userEmail)} (${userEmail})`
    : "Loading parent details...";

  const summaryStudent = selectedStudent
    ? [selectedStudent.name, selectedStudent.className ?? selectedStudent.grade, selectedStudent.campus]
        .filter(Boolean)
        .join(" - ")
    : studentsLoading
    ? "Loading student..."
    : "No linked students";

  return (
    <AppLayout>
      <AppHeader title="Parent Support" showBack showChildSelector />

      <section className="px-4 pt-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Submit a Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Summary</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground space-y-2">
                <div>
                  <span className="font-medium text-foreground">Parent:</span>{" "}
                  {summaryParent}
                </div>
                <div>
                  <span className="font-medium text-foreground">Student:</span>{" "}
                  {summaryStudent}
                </div>
              </div>
            </div>

            {studentsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading linked students...
              </div>
            )}

            {!studentsLoading && studentsError && (
              <div className="text-sm text-destructive">{studentsError}</div>
            )}

            {!studentsLoading && !studentsError && linkedStudents.length > 1 && (
              <div className="space-y-2">
                <Label>Selected Student</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {linkedStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!studentsLoading && !studentsError && linkedStudents.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No linked students yet. Please contact admin.
              </div>
            )}

            <div className="space-y-2">
              <Label>Ticket Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                {ticketTypes.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedType(item.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedType === item.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-2`}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your ticket"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about your inquiry..."
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files
                    ? Array.from(event.target.files)
                    : [];
                  setAttachments(files);
                }}
              />
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {selectedAttachmentsLabel}
              </Button>
              {attachments.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {attachments.map((file) => file.name).join(", ")}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitDisabled}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to School
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm mx-auto bg-card">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-chart-1/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-chart-1" />
            </div>
            <DialogTitle>Ticket Submitted!</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>Your ticket has been sent to the school.</p>
                <div className="font-medium text-foreground">
                  Ticket ID: {newTicketId}
                </div>
                <div className="text-sm">
                  Status: <Badge className="bg-chart-3 text-card">New</Badge>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={closeSuccess} className="w-full mt-4">
            Submit Another Ticket
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
