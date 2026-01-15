import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  List,
  AlertCircle,
  Lightbulb,
  CircleHelp,
  Star,
  Paperclip,
  Send,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useStudentSelection } from "@/hooks/useStudentSelection";

type TicketType = "praise" | "suggestion" | "question" | "complaint" | null;

type ParentTicket = {
  id: string;
  ticket_type: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  campus: string | null;
  contact_number: string | null;
  student_name: string | null;
  student_class: string | null;
  parent_name: string;
  parent_email: string | null;
  attachments?: Array<{
    path: string;
    name: string;
    type: string;
    size: number;
  }>;
};

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
    label: "Complaint",
    icon: AlertCircle,
    color: "bg-destructive text-destructive-foreground",
    description: "Report an issue or concern",
  },
];

const getFallbackName = (email: string) => {
  const beforeAt = email.split("@")[0];
  return beforeAt || email;
};

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [selectedType, setSelectedType] = useState<TicketType>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<ParentTicket | null>(null);
  const [tickets, setTickets] = useState<ParentTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  const fetchTickets = useCallback(async (email: string) => {
    setTicketsLoading(true);
    const { data, error } = await supabase
      .from("parent_tickets")
      .select(
        "id,ticket_type,subject,description,status,created_at,campus,student_name,student_class,parent_name,contact_number,parent_email,attachments"
      )
      .eq("parent_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Unable to load tickets",
        description: error.message,
        variant: "destructive",
      });
      setTickets([]);
    } else {
      setTickets((data as ParentTicket[]) ?? []);
    }
    setTicketsLoading(false);
  }, []);

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
      fetchTickets(email);
      setProfileLoading(false);
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [fetchTickets]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-chart-1 text-card";
      case "in progress":
      case "in_progress":
        return "bg-chart-4 text-card";
      case "open":
      case "new":
        return "bg-chart-3 text-card";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return CheckCircle2;
      case "in progress":
      case "in_progress":
        return Clock;
      default:
        return Circle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "complaint":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "suggestion":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "question":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "praise":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const createdDateLabel = useCallback((date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
    let uploadedAttachments: ParentTicket["attachments"] = [];

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
    if (authEmail) {
      fetchTickets(authEmail);
    }
    setSubmitting(false);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setActiveTab("tickets");
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

  useEffect(() => {
    let isMounted = true;
    const loadAttachmentUrls = async () => {
      if (!selectedTicket?.attachments || selectedTicket.attachments.length === 0) {
        return;
      }
      const missing = selectedTicket.attachments.filter(
        (attachment) => !attachmentUrls[attachment.path]
      );
      if (missing.length === 0) {
        return;
      }
      setAttachmentsLoading(true);
      const updates: Record<string, string> = {};
      for (const attachment of missing) {
        const { data, error } = await supabase.storage
          .from("parent-ticket-attachments")
          .createSignedUrl(attachment.path, 3600);
        if (error || !data?.signedUrl) {
          console.error("[parent_tickets] signed URL failed:", error);
          continue;
        }
        updates[attachment.path] = data.signedUrl;
      }
      if (isMounted && Object.keys(updates).length > 0) {
        setAttachmentUrls((prev) => ({ ...prev, ...updates }));
      }
      if (isMounted) {
        setAttachmentsLoading(false);
      }
    };

    loadAttachmentUrls();
    return () => {
      isMounted = false;
    };
  }, [selectedTicket, attachmentUrls]);

  return (
    <AppLayout>
      <AppHeader title="Parent Support" />

      <section className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4">
            <TabsTrigger value="new" className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <List className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "new" && (
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
        )}

        {activeTab === "tickets" && (
          <div className="space-y-3">
            {ticketsLoading ? (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tickets...
                  </div>
                </CardContent>
              </Card>
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status);
                return (
                  <Card
                    key={ticket.id}
                    className="bg-card border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="outline"
                          className={getTypeColor(ticket.ticket_type)}
                        >
                          {ticket.ticket_type}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {ticket.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {ticket.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {createdDateLabel(ticket.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No tickets found</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setActiveTab("new")}
                  >
                    Create your first ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
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
            View My Tickets
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-w-sm mx-auto bg-card max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={getTypeColor(selectedTicket.ticket_type)}
                  >
                    {selectedTicket.ticket_type}
                  </Badge>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.id} - Submitted{" "}
                  {createdDateLabel(selectedTicket.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Description
                  </Label>
                  <p className="text-sm text-foreground mt-1">
                    {selectedTicket.description}
                  </p>
                </div>

                {(selectedTicket.student_name ||
                  selectedTicket.student_class ||
                  selectedTicket.campus) && (
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Student Details
                    </Label>
                    <div className="text-sm text-foreground mt-1 space-y-1">
                      {selectedTicket.student_name && (
                        <div>{selectedTicket.student_name}</div>
                      )}
                      {selectedTicket.student_class && (
                        <div>{selectedTicket.student_class}</div>
                      )}
                      {selectedTicket.campus && (
                        <div>{selectedTicket.campus}</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTicket.attachments &&
                  selectedTicket.attachments.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Attachments
                      </Label>
                      <div className="text-sm text-foreground mt-2 space-y-3">
                        {attachmentsLoading && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Preparing attachments...
                          </div>
                        )}
                        {selectedTicket.attachments.map((file) => {
                          const signedUrl = attachmentUrls[file.path];
                          const isImage = file.type?.startsWith("image/");
                          return (
                            <div key={file.path} className="flex flex-col gap-2">
                              {isImage && signedUrl ? (
                                <button
                                  type="button"
                                  className="w-fit"
                                  onClick={() =>
                                    window.open(signedUrl, "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <img
                                    src={signedUrl}
                                    alt={file.name}
                                    className="h-20 w-20 rounded-md border border-border object-cover"
                                  />
                                </button>
                              ) : null}
                              {signedUrl ? (
                                <a
                                  href={signedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-primary hover:underline w-fit"
                                >
                                  Open {file.name}
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Generating link for {file.name}...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                <div className="text-xs text-muted-foreground">
                  Responses from staff will appear here once available.
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
