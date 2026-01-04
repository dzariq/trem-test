import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Clock,
  Users,
  BookOpen,
  Trophy,
  Megaphone,
  CreditCard,
  Bus,
  Utensils,
  Camera,
  ClipboardCheck,
  MessageSquare,
  ChevronRight,
  GraduationCap
} from "lucide-react";

type NotificationType = 
  | "announcement" 
  | "event" 
  | "academic" 
  | "alert" 
  | "attendance" 
  | "grade"
  | "report_card"
  | "award"
  | "payment"
  | "transport"
  | "meal"
  | "photo"
  | "permission"
  | "ptm"
  | "message";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  linkTo?: string; // Navigation path when clicked
  linkParams?: Record<string, string>; // Optional params like announcement ID
}

const parentNotifications: Notification[] = [
  {
    id: "1",
    type: "announcement",
    title: "School Holiday Notice",
    message: "School will be closed on 29th January for Chinese New Year.",
    time: "2 hours ago",
    isRead: false,
    linkTo: "/parent/announcements/1"
  },
  {
    id: "2",
    type: "event",
    title: "Sports Day Reminder",
    message: "Don't forget! Sports Day is on 15th January. Please prepare sports attire.",
    time: "5 hours ago",
    isRead: false,
    linkTo: "/parent/calendar"
  },
  {
    id: "3",
    type: "report_card",
    title: "Report Card Available",
    message: "Mid-Year 2025 report card is now available for download.",
    time: "1 day ago",
    isRead: false,
    linkTo: "/parent/academic"
  },
  {
    id: "4",
    type: "payment",
    title: "Fee Payment Reminder",
    message: "Term 2 school fees are due by 31st January.",
    time: "2 days ago",
    isRead: true,
    linkTo: "/parent/support"
  },
  {
    id: "5",
    type: "ptm",
    title: "Parent-Teacher Meeting",
    message: "PTM scheduled for 20th January. Please book your slot.",
    time: "3 days ago",
    isRead: true,
    linkTo: "/parent/calendar"
  },
  {
    id: "6",
    type: "award",
    title: "New Award Earned! 🏆",
    message: "Emma has received the Science Fair Gold Award. View certificate now!",
    time: "4 days ago",
    isRead: false,
    linkTo: "/parent/academic?tab=cocurriculum"
  },
  {
    id: "7",
    type: "attendance",
    title: "Attendance Update",
    message: "Emma was marked late today at 8:15 AM.",
    time: "Today",
    isRead: false,
    linkTo: "/parent/attendance"
  },
  {
    id: "8",
    type: "grade",
    title: "New Grade Posted",
    message: "Mathematics mid-year exam grade has been updated.",
    time: "5 days ago",
    isRead: true,
    linkTo: "/parent/academic"
  },
  {
    id: "9",
    type: "meal",
    title: "Meal Plan Renewal",
    message: "Your child's meal plan expires on 31st January. Renew now to avoid interruption.",
    time: "1 week ago",
    isRead: true,
    linkTo: "/parent"
  },
  {
    id: "10",
    type: "announcement",
    title: "New School Uniform Policy",
    message: "Updated uniform guidelines effective from February 2026. Read the full announcement.",
    time: "1 week ago",
    isRead: true,
    linkTo: "/parent/announcements/2"
  },
  {
    id: "11",
    type: "permission",
    title: "Permission Slip Required",
    message: "Please sign the field trip permission slip for the Zoo visit on 25th January.",
    time: "2 weeks ago",
    isRead: true,
    linkTo: "/parent/support"
  },
  {
    id: "12",
    type: "photo",
    title: "New Photos Available",
    message: "Class photos from the Art Exhibition are now available to view.",
    time: "2 weeks ago",
    isRead: true,
    linkTo: "/parent"
  }
];

const teacherNotifications: Notification[] = [
  {
    id: "1",
    type: "attendance",
    title: "Attendance Reminder",
    message: "Please submit attendance for Class 5A before 9:00 AM.",
    time: "30 mins ago",
    isRead: false,
    linkTo: "/teacher/attendance"
  },
  {
    id: "2",
    type: "grade",
    title: "Grade Submission Due",
    message: "Mid-Year exam grades for Class 5A are due by January 10th.",
    time: "2 hours ago",
    isRead: false,
    linkTo: "/teacher/academic"
  },
  {
    id: "3",
    type: "event",
    title: "Staff Meeting",
    message: "Weekly staff meeting scheduled for Friday at 3:00 PM in the conference room.",
    time: "5 hours ago",
    isRead: false,
    linkTo: "/teacher/calendar"
  },
  {
    id: "4",
    type: "announcement",
    title: "School Holiday Notice",
    message: "School will be closed on 29th January for Chinese New Year.",
    time: "1 day ago",
    isRead: true,
    linkTo: "/teacher"
  },
  {
    id: "5",
    type: "academic",
    title: "New Curriculum Update",
    message: "Updated Science curriculum materials are now available for download.",
    time: "2 days ago",
    isRead: true,
    linkTo: "/teacher/academic"
  },
  {
    id: "6",
    type: "alert",
    title: "Student Absence Alert",
    message: "Ahmad bin Ali (5A) has been absent for 3 consecutive days.",
    time: "2 days ago",
    isRead: true,
    linkTo: "/teacher/attendance"
  },
  {
    id: "7",
    type: "message",
    title: "Parent Message",
    message: "Mrs. Johnson has sent you a message regarding Emma's progress.",
    time: "3 days ago",
    isRead: false,
    linkTo: "/teacher"
  },
  {
    id: "8",
    type: "ptm",
    title: "PTM Slot Booked",
    message: "Mr. & Mrs. Ahmad have booked a slot for 20th January at 2:00 PM.",
    time: "4 days ago",
    isRead: true,
    linkTo: "/teacher/calendar"
  }
];

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher?: boolean;
}

export function NotificationsDrawer({ open, onOpenChange, isTeacher = false }: NotificationsDrawerProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(isTeacher ? teacherNotifications : parentNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "announcement": return Megaphone;
      case "event": return Calendar;
      case "academic": return GraduationCap;
      case "alert": return AlertCircle;
      case "attendance": return Users;
      case "grade": return BookOpen;
      case "report_card": return FileText;
      case "award": return Trophy;
      case "payment": return CreditCard;
      case "transport": return Bus;
      case "meal": return Utensils;
      case "photo": return Camera;
      case "permission": return ClipboardCheck;
      case "ptm": return MessageSquare;
      case "message": return MessageSquare;
      default: return Bell;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "announcement": return "bg-primary text-primary-foreground";
      case "event": return "bg-blue-500 text-white";
      case "academic": return "bg-indigo-500 text-white";
      case "alert": return "bg-destructive text-destructive-foreground";
      case "attendance": return "bg-emerald-500 text-white";
      case "grade": return "bg-purple-500 text-white";
      case "report_card": return "bg-amber-500 text-white";
      case "award": return "bg-yellow-500 text-white";
      case "payment": return "bg-rose-500 text-white";
      case "transport": return "bg-cyan-500 text-white";
      case "meal": return "bg-orange-500 text-white";
      case "photo": return "bg-pink-500 text-white";
      case "permission": return "bg-teal-500 text-white";
      case "ptm": return "bg-violet-500 text-white";
      case "message": return "bg-sky-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    // Navigate if there's a link
    if (notification.linkTo) {
      onOpenChange(false); // Close drawer
      navigate(notification.linkTo);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 py-3">
          {/* Filter and Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Badge 
                variant={filter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter("all")}
              >
                All ({notifications.length})
              </Badge>
              <Badge 
                variant={filter === "unread" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </Badge>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-6" style={{ maxHeight: "calc(85vh - 140px)" }}>
          {/* Notifications List */}
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              const hasLink = !!notification.linkTo;
              
              return (
                <div 
                  key={notification.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                    !notification.isRead 
                      ? "bg-primary/5 border border-primary/20" 
                      : "bg-muted/30"
                  } ${hasLink ? "cursor-pointer" : ""}`}
                  onClick={() => hasLink && handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm text-foreground truncate ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {notification.time}
                    </span>
                  </div>
                  
                  {/* Arrow */}
                  {hasLink && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
