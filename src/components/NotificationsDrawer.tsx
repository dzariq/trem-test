import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SwipeableNotification } from "@/components/SwipeableNotification";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, 
  Calendar, 
  CalendarRange,
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
  Loader2,
  Palette,
  Palmtree,
  PenLine,
  X,
  ChevronRight
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
  | "message"
  | "cca"
  | "holiday"
  | "exam"
  | "weekly_digest";

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
      case "cca": return Palette;
      case "holiday": return Palmtree;
      case "exam": return PenLine;
      case "weekly_digest": return CalendarRange;
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
      case "cca": return "bg-emerald-500 text-white";
      case "holiday": return "bg-teal-500 text-white";
      case "exam": return "bg-rose-500 text-white";
      case "weekly_digest": return "bg-emerald-600 text-white";
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

  // Group notifications by week buckets (only when showing All)
  const groupedSections = (() => {
    if (filter !== "all") return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Monday
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dayOfWeek);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(thisWeekStart);
    nextWeekEnd.setDate(thisWeekStart.getDate() + 14);

    const inbox: typeof filteredNotifications = [];
    const thisWeek: typeof filteredNotifications = [];
    const nextWeek: typeof filteredNotifications = [];
    const later: typeof filteredNotifications = [];

    for (const n of filteredNotifications) {
      if (!n.event_date) {
        inbox.push(n);
        continue;
      }
      const d = new Date(n.event_date);
      if (d < thisWeekEnd) thisWeek.push(n);
      else if (d < nextWeekEnd) nextWeek.push(n);
      else later.push(n);
    }

    return [
      { key: "inbox", label: "Latest", items: inbox },
      { key: "this", label: "This week", items: thisWeek },
      { key: "next", label: "Next week", items: nextWeek },
      { key: "later", label: "Later", items: later },
    ].filter((s) => s.items.length > 0);
  })();

  const renderItem = (notification: typeof filteredNotifications[number]) => {
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
  };

  const formatDatePill = (iso: string) => {
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const num = d.getDate();
    return { day, num };
  };

  const renderWeekBucket = (
    section: { key: string; label: string; items: typeof filteredNotifications }
  ) => {
    const sortedItems = [...section.items].sort((a, b) => {
      const ta = a.event_date ? new Date(a.event_date).getTime() : 0;
      const tb = b.event_date ? new Date(b.event_date).getTime() : 0;
      return ta - tb;
    });
    const unreadInBucket = sortedItems.filter((n) => !n.is_read).length;

    return (
      <div key={section.key} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {section.label}
            </h4>
            <span className="text-[11px] text-muted-foreground">
              {sortedItems.length} event{sortedItems.length === 1 ? "" : "s"}
            </span>
          </div>
          {unreadInBucket > 0 && (
            <span className="text-[10px] font-medium text-primary">
              {unreadInBucket} new
            </span>
          )}
        </div>
        <ul className="divide-y divide-border">
          {sortedItems.map((n) => {
            const pill = n.event_date ? formatDatePill(n.event_date) : null;
            return (
              <li
                key={n.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:bg-muted/60 transition-colors ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(n)}
              >
                {pill && (
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center">
                    <span className="text-[9px] font-semibold uppercase leading-none">
                      {pill.day}
                    </span>
                    <span className="text-base font-bold leading-none mt-0.5">
                      {pill.num}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm text-foreground truncate ${
                        !n.is_read ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {n.time}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="flex-shrink-0 w-7 h-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0 -ml-1" />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

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

      <div className="flex-1 px-4 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 pb-6 overflow-x-hidden">
            {groupedSections ? (
              groupedSections.map((section) => {
                if (section.key === "inbox") {
                  return (
                    <div key={section.key} className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                        {section.label}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map(renderItem)}
                      </div>
                    </div>
                  );
                }
                return renderWeekBucket(section);
              })
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(renderItem)}
              </div>
            )}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
