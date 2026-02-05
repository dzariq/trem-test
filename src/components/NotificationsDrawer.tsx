import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SwipeableNotification } from "@/components/SwipeableNotification";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, 
  Calendar, 
  FileText, 
  AlertCircle, 
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
  GraduationCap,
  Loader2
} from "lucide-react";
import { useState } from "react";

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

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher?: boolean;
}

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllRead
  } = useNotifications();
  
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const getTypeIcon = (type: string) => {
    switch (type as NotificationType) {
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

  const getTypeColor = (type: string) => {
    switch (type as NotificationType) {
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

  const handleNotificationClick = (notification: { id: string; link_to: string | null; is_read: boolean }) => {
    // Mark as read if not already
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate if there's a link
    if (notification.link_to) {
      onOpenChange(false);
      navigate(notification.link_to);
    }
  };

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </div>
      }
      snapPoints={[0, 0.5, 0.85, 1]}
      defaultSnapPoint={0.85}
      showHandle
    >
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()} 
              className="text-xs"
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : null}
              Mark all read
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Swipe left to dismiss • Tap to open
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {filteredNotifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              const hasLink = !!notification.link_to;
              
              return (
                <SwipeableNotification
                  key={notification.id}
                  id={notification.id}
                  icon={<Icon className="h-5 w-5" />}
                  iconBgClass={getTypeColor(notification.type)}
                  title={notification.title}
                  message={notification.message}
                  time={notification.time}
                  isRead={notification.is_read}
                  hasLink={hasLink}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </BottomSheet>
  );
}
