import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Users,
  BookOpen
} from "lucide-react";

type NotificationType = "announcement" | "event" | "academic" | "alert" | "attendance" | "grade";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const parentNotifications: Notification[] = [
  {
    id: "1",
    type: "announcement",
    title: "School Holiday Notice",
    message: "School will be closed on 29th January for Chinese New Year.",
    time: "2 hours ago",
    isRead: false
  },
  {
    id: "2",
    type: "event",
    title: "Sports Day Reminder",
    message: "Don't forget! Sports Day is on 15th January. Please prepare sports attire.",
    time: "5 hours ago",
    isRead: false
  },
  {
    id: "3",
    type: "academic",
    title: "Report Card Available",
    message: "Mid-Year 2025 report card is now available for download.",
    time: "1 day ago",
    isRead: false
  },
  {
    id: "4",
    type: "alert",
    title: "Fee Payment Reminder",
    message: "Term 2 school fees are due by 31st January.",
    time: "2 days ago",
    isRead: true
  },
  {
    id: "5",
    type: "event",
    title: "Parent-Teacher Meeting",
    message: "PTM scheduled for 20th January. Please book your slot.",
    time: "3 days ago",
    isRead: true
  }
];

const teacherNotifications: Notification[] = [
  {
    id: "1",
    type: "attendance",
    title: "Attendance Reminder",
    message: "Please submit attendance for Class 5A before 9:00 AM.",
    time: "30 mins ago",
    isRead: false
  },
  {
    id: "2",
    type: "grade",
    title: "Grade Submission Due",
    message: "Mid-Year exam grades for Class 5A are due by January 10th.",
    time: "2 hours ago",
    isRead: false
  },
  {
    id: "3",
    type: "event",
    title: "Staff Meeting",
    message: "Weekly staff meeting scheduled for Friday at 3:00 PM in the conference room.",
    time: "5 hours ago",
    isRead: false
  },
  {
    id: "4",
    type: "announcement",
    title: "School Holiday Notice",
    message: "School will be closed on 29th January for Chinese New Year.",
    time: "1 day ago",
    isRead: true
  },
  {
    id: "5",
    type: "academic",
    title: "New Curriculum Update",
    message: "Updated Science curriculum materials are now available for download.",
    time: "2 days ago",
    isRead: true
  },
  {
    id: "6",
    type: "alert",
    title: "Student Absence Alert",
    message: "Ahmad bin Ali (5A) has been absent for 3 consecutive days.",
    time: "2 days ago",
    isRead: true
  }
];

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher?: boolean;
}

export function NotificationsDrawer({ open, onOpenChange, isTeacher = false }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState(isTeacher ? teacherNotifications : parentNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "announcement": return Bell;
      case "event": return Calendar;
      case "academic": return FileText;
      case "alert": return AlertCircle;
      case "attendance": return Users;
      case "grade": return BookOpen;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "announcement": return "bg-primary text-primary-foreground";
      case "event": return "bg-blue-500 text-white";
      case "academic": return "bg-amber-500 text-white";
      case "alert": return "bg-destructive text-destructive-foreground";
      case "attendance": return "bg-emerald-500 text-white";
      case "grade": return "bg-purple-500 text-white";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-6" style={{ maxHeight: "calc(85vh - 140px)" }}>
          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              return (
                <Card 
                  key={notification.id} 
                  className={`bg-card border-border shadow-sm transition-all ${
                    !notification.isRead ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-medium text-foreground ${!notification.isRead ? "font-semibold" : ""}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </span>
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Read
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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