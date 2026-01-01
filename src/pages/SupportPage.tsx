import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { tickets } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  HelpCircle, 
  Heart,
  Paperclip,
  Send,
  CheckCircle2,
  Clock,
  Circle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TicketType = "Complaint" | "Suggestion" | "Question" | "Praise" | null;

const ticketTypes = [
  { type: "Complaint" as const, icon: AlertCircle, color: "bg-destructive text-destructive-foreground", description: "Report an issue or concern" },
  { type: "Suggestion" as const, icon: Lightbulb, color: "bg-chart-4 text-card", description: "Share ideas for improvement" },
  { type: "Question" as const, icon: HelpCircle, color: "bg-chart-3 text-card", description: "Ask about school matters" },
  { type: "Praise" as const, icon: Heart, color: "bg-chart-1 text-card", description: "Appreciate staff or services" },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [selectedType, setSelectedType] = useState<TicketType>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return "bg-chart-1 text-card";
      case "in progress": return "bg-chart-4 text-card";
      case "open": return "bg-chart-3 text-card";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return CheckCircle2;
      case "in progress": return Clock;
      default: return Circle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "complaint": return "bg-destructive/10 text-destructive border-destructive/20";
      case "suggestion": return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "question": return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "praise": return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleSubmit = () => {
    if (!selectedType || !subject || !description || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
    setNewTicketId(ticketId);
    setShowSuccess(true);
    
    // Reset form
    setSelectedType(null);
    setSubject("");
    setDescription("");
    setCategory("");
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setActiveTab("tickets");
  };

  return (
    <AppLayout>
      <AppHeader title="Parent Support" />

      <section className="px-4 pt-4">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button 
            variant={activeTab === "new" ? "default" : "outline"}
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setActiveTab("new")}
          >
            <Plus className="h-6 w-6" />
            <span className="font-medium">New Ticket</span>
          </Button>
          <Button 
            variant={activeTab === "tickets" ? "default" : "outline"}
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setActiveTab("tickets")}
          >
            <List className="h-6 w-6" />
            <span className="font-medium">My Tickets</span>
          </Button>
        </div>

        {activeTab === "new" && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Submit a Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ticket Type Selection */}
              <div className="space-y-2">
                <Label>Ticket Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ticketTypes.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setSelectedType(item.type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedType === item.type 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mx-auto mb-2`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="font-medium text-foreground text-sm">{item.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input 
                  id="subject"
                  placeholder="Brief summary of your ticket"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea 
                  id="description"
                  placeholder="Provide details about your inquiry..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <Button variant="outline" className="w-full justify-start text-muted-foreground">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add files (images, PDFs)
                </Button>
              </div>

              {/* Submit Button */}
              <Button className="w-full" onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Send to School
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-3">
            {tickets.length > 0 ? (
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
                        <Badge variant="outline" className={getTypeColor(ticket.type)}>
                          {ticket.type}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {ticket.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">{ticket.id}</span>
                        <span className="text-xs text-muted-foreground">{ticket.dateSubmitted}</span>
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

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm mx-auto bg-card">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-chart-1/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-chart-1" />
            </div>
            <DialogTitle>Ticket Submitted!</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Your ticket has been sent to the school.</p>
              <p className="font-medium text-foreground">Ticket ID: {newTicketId}</p>
              <p className="text-sm">Status: <Badge className="bg-chart-3 text-card">Open</Badge></p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={closeSuccess} className="w-full mt-4">
            View My Tickets
          </Button>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-sm mx-auto bg-card max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className={getTypeColor(selectedTicket.type)}>
                    {selectedTicket.type}
                  </Badge>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.id} • Submitted {selectedTicket.dateSubmitted}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm text-foreground mt-1">{selectedTicket.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Category</Label>
                  <p className="text-sm text-foreground mt-1 capitalize">{selectedTicket.category}</p>
                </div>

                {selectedTicket.replies.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Replies</Label>
                    <div className="space-y-2">
                      {selectedTicket.replies.map((reply, index) => (
                        <Card key={index} className="bg-accent/50 border-primary/20">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-foreground">{reply.from}</span>
                              <span className="text-xs text-muted-foreground">{reply.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{reply.message}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
