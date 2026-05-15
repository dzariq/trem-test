import { useNavigate, useLocation } from "react-router-dom";
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
import { useState, useMemo, useEffect } from "react";

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
  const location = useLocation();
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
  const [activeDigest, setActiveDigest] = useState<
    { id: string; title: string; message: string; type: string } | null
  >(null);

  // Bridge across route navigations: when a digest is opened, we close the
  // drawer and navigate to the calendar. The destination route mounts a fresh
  // AppHeader/NotificationsDrawer instance, so we hand off the popup payload
  // via sessionStorage and re-hydrate on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("notif_active_digest");
      if (raw) {
        sessionStorage.removeItem("notif_active_digest");
        setActiveDigest(JSON.parse(raw));
      }
    } catch {}
  }, []);

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
          groups.get(key)!.push(`[${e.type}] ${e.title}`);
        }
        const lines = Array.from(groups.entries())
          .map(
            ([day, titles]) =>
              `${day}\n${titles.map((t) => `  • ${t}`).join("\n")}`,
          )
          .join("\n\n");
        const label = weekOffset === 0 ? "Week at a glance" : "Next week at a glance";
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
          .map((e) => `• [${e.type}] ${e.title}`)
          .join("\n");

        const isToday = day.getTime() === today.getTime();
        const isFuture = day.getTime() > today.getTime();
        const prefix = isToday ? "What's on today" : isFuture ? "What's on" : "Daily recap";
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
    const item = allSyntheticItems.find((it) => it.id === id);
    if (!readSynthetic[id]) {
      const next = { ...readSynthetic, [id]: true };
      setReadSynthetic(next);
      persistSynthetic("notif_synthetic_read", next);
    }
    if (!item) return;
    const calendarPath = location.pathname.startsWith("/teacher")
      ? "/teacher/calendar"
      : "/parent/calendar";
    const alreadyOnCalendar = location.pathname === calendarPath;
    if (alreadyOnCalendar) {
      onOpenChange(false);
      setActiveDigest(item);
      return;
    }
    try {
      sessionStorage.setItem("notif_active_digest", JSON.stringify(item));
    } catch {}
    onOpenChange(false);
    navigate(calendarPath);
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
    <>
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
    {activeDigest && (
      <DigestPopup digest={activeDigest} onClose={() => setActiveDigest(null)} />
    )}
    </>
  );
}

function DigestPopup({
  digest,
  onClose,
}: {
  digest: { id: string; title: string; message: string; type: string };
  onClose: () => void;
}) {
  // Parse the message into day groups.
  // Weekly digest format:
  //   "Wed, May 13\n  • Y1-2 MYE Ends\n\nThu, May 14\n  • ..."
  // Daily digest format:
  //   "• Title A\n• Title B"
  const groups = useMemo(() => {
    const lines = digest.message.split("\n");
    const result: Array<{ day: string | null; items: string[] }> = [];
    let current: { day: string | null; items: string[] } | null = null;
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) continue;
      const bulletMatch = line.match(/^\s*•\s*(.+)$/);
      if (bulletMatch) {
        if (!current) {
          current = { day: null, items: [] };
          result.push(current);
        }
        current.items.push(bulletMatch[1].trim());
      } else {
        current = { day: line.trim(), items: [] };
        result.push(current);
      }
    }
    return result;
  }, [digest.message]);

  // Split "Title — subtitle" pattern (e.g., "Week at a glance — Mon, May 11 to Sun, May 17")
  const [headTitle, headSubtitle] = useMemo(() => {
    const idx = digest.title.indexOf(" — ");
    if (idx === -1) return [digest.title, null as string | null];
    return [digest.title.slice(0, idx), digest.title.slice(idx + 3)];
  }, [digest.title]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
      style={{
        paddingTop: "calc(var(--safe-top, 0px) + 1rem)",
        paddingBottom: "calc(var(--safe-bottom, 0px) + 1rem)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] flex flex-col rounded-[28px] bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-primary/10 border border-border/60 overflow-hidden animate-in zoom-in-95"
        style={{
          maxHeight: "min(80vh, 640px)",
          boxShadow:
            "0 24px 60px -20px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--primary) / 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {headTitle}
            </h2>
            {headSubtitle && (
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {headSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
          {groups.flatMap((group, gi) => {
            // Parse "WED, MAY 13" -> { weekday: "Wed", month: "May", day: "13" }
            let weekday: string | null = null;
            let month: string | null = null;
            let day: string | null = null;
            if (group.day) {
              const m = group.day.match(/^([A-Za-z]+),?\s+([A-Za-z]+)\s+(\d{1,2})/);
              if (m) {
                weekday = m[1].slice(0, 3);
                month = m[2].slice(0, 3);
                day = m[3];
              }
            }
            return group.items.map((item, ii) => {
              // Extract optional [type] prefix
              const typeMatch = item.match(/^\[([a-z_]+)\]\s*(.*)$/i);
              const itemType = typeMatch ? typeMatch[1].toLowerCase() : "event";
              const rest = typeMatch ? typeMatch[2] : item;
              // Strip leading emoji / pictographs and stray whitespace
              const cleaned = rest
                .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, "")
                .trim();

              // Map category -> Tailwind classes (semantic-ish, scoped to this popup)
              const palette: Record<
                string,
                { bar: string; pillBg: string; pillBorder: string; monthText: string; dayText: string; label: string }
              > = {
                holiday: {
                  bar: "bg-rose-400",
                  pillBg: "bg-rose-50",
                  pillBorder: "border-rose-200",
                  monthText: "text-rose-500",
                  dayText: "text-rose-700",
                  label: "Holiday",
                },
                exam: {
                  bar: "bg-amber-400",
                  pillBg: "bg-amber-50",
                  pillBorder: "border-amber-200",
                  monthText: "text-amber-600",
                  dayText: "text-amber-800",
                  label: "Exam",
                },
                academic: {
                  bar: "bg-blue-400",
                  pillBg: "bg-blue-50",
                  pillBorder: "border-blue-200",
                  monthText: "text-blue-500",
                  dayText: "text-blue-700",
                  label: "Academic",
                },
                cca: {
                  bar: "bg-violet-400",
                  pillBg: "bg-violet-50",
                  pillBorder: "border-violet-200",
                  monthText: "text-violet-500",
                  dayText: "text-violet-700",
                  label: "CCA",
                },
                event: {
                  bar: "bg-emerald-400",
                  pillBg: "bg-emerald-50",
                  pillBorder: "border-emerald-200",
                  monthText: "text-emerald-600",
                  dayText: "text-emerald-700",
                  label: "Event",
                },
              };
              const c = palette[itemType] || palette.event;

              return (
                <div
                  key={`${gi}-${ii}`}
                  className="relative flex items-center gap-3 p-3 pl-4 rounded-xl bg-muted/40 border border-border/50 overflow-hidden"
                >
                  <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${c.bar}`} />
                  {day ? (
                    <div className={`w-12 flex-shrink-0 flex flex-col items-center justify-center rounded-lg border ${c.pillBg} ${c.pillBorder} py-1.5`}>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${c.monthText}`}>
                        {month}
                      </span>
                      <span className={`text-base font-bold leading-tight mt-0.5 ${c.dayText}`}>
                        {day}
                      </span>
                    </div>
                  ) : null}
                  <span className="text-sm font-medium text-foreground leading-snug flex-1">
                    {cleaned || rest}
                  </span>
                </div>
              );
            });
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pt-3 pb-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
