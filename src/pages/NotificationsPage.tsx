import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Trash2,
  Check
} from "lucide-react";

type NotificationType = "announcement" | "event" | "academic" | "alert";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "announcement": return Bell;
      case "event": return Calendar;
      case "academic": return FileText;
      case "alert": return AlertCircle;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "announcement": return "bg-primary text-primary-foreground";
      case "event": return "bg-blue-500 text-white";
      case "academic": return "bg-amber-500 text-white";
      case "alert": return "bg-destructive text-destructive-foreground";
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
    <AppLayout>
      <AppHeader title="Notifications" showBack showNotifications={false} />

      <section className="px-4 py-4">
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
      </section>
    </AppLayout>
  );
}
