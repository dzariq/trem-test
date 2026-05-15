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
  Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";

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
  
  const [filter, setFilter] = useState<"unread" | "read">("unread");
  const [dismissedSynthetic, setDismissedSynthetic] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("notif_synthetic_dismissed") || "{}");
    } catch {
      return {};
    }
  });
  const [readSynthetic, setReadSynthetic] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("notif_synthetic_read") || "{}");
    } catch {
      return {};
    }
  });

  const persistSynthetic = (key: "notif_synthetic_dismissed" | "notif_synthetic_read", value: Record<string, boolean>) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

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

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications.filter((n) => n.is_read);

  // Build synthetic summaries (today + Monday weekly) as plain text digests
  const allSyntheticItems = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dayOfWeek);

    const fmtDay = (d: Date) =>
      d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
    const isoKey = (d: Date) => d.toISOString().slice(0, 10);

    const items: Array<{ id: string; title: string; message: string; type: string }> = [];

    // Backfill + forward-fill: render daily digests for every day in this week
    // and next week that has events, plus a weekly digest for each Monday.
    // This lets users see the full notification logic without waiting for the
    // calendar to roll forward.
    for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
      const weekStart = new Date(thisWeekStart);
      weekStart.setDate(thisWeekStart.getDate() + weekOffset * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const lastDay = new Date(weekEnd);
      lastDay.setDate(weekEnd.getDate() - 1);
      const weekKey = `week-${isoKey(weekStart)}`;

      const weekEvents = notifications.filter((n) => {
        if (!n.event_date) return false;
        const d = new Date(n.event_date);
        return d >= weekStart && d < weekEnd;
      });

      // Weekly digest (Monday)
      if (weekEvents.length > 0 && !dismissedSynthetic[weekKey]) {
        const groups = new Map<string, string[]>();
        const sorted = [...weekEvents].sort(
          (a, b) =>
            new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime(),
        );
        for (const e of sorted) {
          const d = new Date(e.event_date!);
          const key = fmtDay(d);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(e.title);
        }
        const lines = Array.from(groups.entries())
          .map(
            ([day, titles]) =>
              `${day}\n${titles.map((t) => `  • ${t}`).join("\n")}`,
          )
          .join("\n\n");
        const label = weekOffset === 0 ? "This week" : "Next week";
        items.push({
          id: weekKey,
          title: `${label} — ${fmtDay(weekStart)} to ${fmtDay(lastDay)}`,
          message: lines,
          type: "weekly_digest",
        });
      }

      // Daily digests for each day in the week that has events
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dayEnd = new Date(day);
        dayEnd.setDate(day.getDate() + 1);
        const dayKey = `today-${isoKey(day)}`;
        if (dismissedSynthetic[dayKey]) continue;

        const dayEvents = weekEvents.filter((n) => {
          const d = new Date(n.event_date!);
          return d >= day && d < dayEnd;
        });
        if (dayEvents.length === 0) continue;

        const lines = dayEvents
          .slice()
          .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
          .map((e) => `• ${e.title}`)
          .join("\n");

        const isToday = day.getTime() === today.getTime();
        const prefix = isToday ? "Today" : "Daily";
        items.push({
          id: dayKey,
          title: `${prefix} — ${fmtDay(day)}`,
          message: lines,
          type: "event",
        });
      }
    }

    return items;
  }, [notifications, dismissedSynthetic]);

  const syntheticItems = allSyntheticItems.filter((it) =>
    filter === "unread" ? !readSynthetic[it.id] : !!readSynthetic[it.id]
  );

  const unreadSyntheticCount = allSyntheticItems.filter((it) => !readSynthetic[it.id]).length;
  const readSyntheticCount = allSyntheticItems.filter((it) => !!readSynthetic[it.id]).length;
  const nonEventNotifications = notifications.filter((n) => !n.event_date);
  const totalUnread =
    nonEventNotifications.filter((n) => !n.is_read).length + unreadSyntheticCount;
  const totalRead =
    nonEventNotifications.filter((n) => n.is_read).length + readSyntheticCount;

  const dismissSynthetic = (id: string) => {
    const next = { ...dismissedSynthetic, [id]: true };
    setDismissedSynthetic(next);
    persistSynthetic("notif_synthetic_dismissed", next);
  };
  const markSyntheticRead = (id: string) => {
    if (readSynthetic[id]) return;
    const next = { ...readSynthetic, [id]: true };
    setReadSynthetic(next);
    persistSynthetic("notif_synthetic_read", next);
  };

  const handleSyntheticOpen = (id: string) => {
    if (!readSynthetic[id]) {
      const next = { ...readSynthetic, [id]: true };
      setReadSynthetic(next);
      persistSynthetic("notif_synthetic_read", next);
    }
    onOpenChange(false);
    navigate("/calendar");
  };

  const renderSynthetic = (item: { id: string; title: string; message: string; type: string }) => {
    const Icon = getTypeIcon(item.type);
    const isRead = !!readSynthetic[item.id];
    return (
      <div
        key={item.id}
        onClick={() => handleSyntheticOpen(item.id)}
        className={`relative flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer active:bg-muted/60 transition-colors ${
          !isRead ? "bg-primary/5" : "bg-card"
        }`}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
            <p className={`text-sm text-foreground truncate ${!isRead ? "font-semibold" : "font-medium"}`}>
              {item.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">{item.message}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="flex-shrink-0 w-7 h-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            dismissSynthetic(item.id);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // Only show non-event notifications individually; event-derived items are
  // surfaced by the daily/weekly digests above.
  const otherNotifications = filteredNotifications.filter((n) => !n.event_date);

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
              variant={filter === "unread" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter("unread")}
            >
              Unread ({totalUnread})
            </Badge>
            <Badge 
              variant={filter === "read" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter("read")}
            >
              Read ({totalRead})
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
          Tap to open • Tap × to dismiss
        </p>
      </div>

      <div className="flex-1 px-4 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 pb-6 overflow-x-hidden">
            {syntheticItems.map(renderSynthetic)}
            {otherNotifications.map(renderItem)}

            {syntheticItems.length === 0 && otherNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {filter === "unread" ? "No unread notifications" : "No read notifications"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
