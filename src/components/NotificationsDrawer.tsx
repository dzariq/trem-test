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
  Tent,
  PartyPopper,
  X,
  Sparkles,
  Clock,
  Stamp
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

// Format a date relative to today, e.g. "today", "in 3 days", "2 days ago".
function formatRelativeDays(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

// Parse the underlying anchor date from a synthetic digest id (week-/today-YYYY-MM-DD).
function parseSyntheticAnchorDate(id: string): Date | null {
  const m = id.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// Parse the attendance date out of a notification message ("... on 14 MAY 2026").
function parseAttendanceDate(message: string): Date | null {
  const m = message.match(/\bon\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/);
  if (!m) return null;
  const d = new Date(m[1]);
  return isNaN(d.getTime()) ? null : d;
}

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
  | "cca_club"
  | "cca_outdoor"
  | "cca_event"
  | "cca_sport"
  | "holiday"
  | "exam"
  | "weekly_digest"
  | "visa";

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
      case "cca_club": return Palette;
      case "cca_outdoor": return Tent;
      case "cca_event": return PartyPopper;
      case "cca_sport": return Trophy;
      case "holiday": return Palmtree;
      case "exam": return PenLine;
      case "weekly_digest": return CalendarRange;
      case "visa": return Stamp;
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
      case "cca_club": return "bg-emerald-500 text-white";
      case "cca_outdoor": return "bg-amber-600 text-white";
      case "cca_event": return "bg-fuchsia-500 text-white";
      case "cca_sport": return "bg-orange-500 text-white";
      case "holiday": return "bg-teal-500 text-white";
      case "exam": return "bg-rose-500 text-white";
      case "weekly_digest": return "bg-emerald-600 text-white";
      case "visa": return "bg-sky-500 text-white";
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

    // Schedule:
    //  - Monday  → "Week at a glance" for Mon→Sun this week (NO daily digest today).
    //  - Tue–Sun → "What's on — <today>" with today's events only.
    // No past-day recaps and no future-day previews.
    const isMonday = today.getDay() === 1;

    if (isMonday) {
      const weekStart = thisWeekStart;
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const lastDay = new Date(weekEnd);
      lastDay.setDate(weekEnd.getDate() - 1);
      const weekKey = `week-${isoKey(weekStart)}`;

      if (!dismissedSynthetic[weekKey]) {
        const weekEvents = notifications.filter((n) => {
          if (!n.event_date) return false;
          const d = new Date(n.event_date);
          return d >= weekStart && d < weekEnd;
        });
        if (weekEvents.length > 0) {
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
          items.push({
            id: weekKey,
            title: `Week at a glance — ${fmtDay(weekStart)} to ${fmtDay(lastDay)}`,
            message: lines,
            type: "weekly_digest",
          });
        }
      }
    } else {
      const dayKey = `today-${isoKey(today)}`;
      if (!dismissedSynthetic[dayKey]) {
        const dayEnd = new Date(today);
        dayEnd.setDate(today.getDate() + 1);
        const dayEvents = notifications.filter((n) => {
          if (!n.event_date) return false;
          const d = new Date(n.event_date);
          return d >= today && d < dayEnd;
        });
        if (dayEvents.length > 0) {
          const lines = dayEvents
            .slice()
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
            .map((e) => `• [${e.type}] ${e.title}`)
            .join("\n");
          items.push({
            id: dayKey,
            title: `What's on today — ${fmtDay(today)}`,
            message: lines,
            type: "event",
          });
        }
      }
    }

    return items;
  }, [notifications, dismissedSynthetic]);

  const syntheticItems = allSyntheticItems
    .filter((it) =>
      filter === "unread" ? !readSynthetic[it.id] : !!readSynthetic[it.id]
    )
    .slice()
    .sort((a, b) => {
      const da = parseSyntheticAnchorDate(a.id)?.getTime() ?? 0;
      const db = parseSyntheticAnchorDate(b.id)?.getTime() ?? 0;
      return db - da;
    });

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
    const anchorDate = parseSyntheticAnchorDate(item.id);
    const relativeLabel = anchorDate ? formatRelativeDays(anchorDate) : null;
    // Parse message lines into structured rows: [category] title
    // Supports daily ("• [exam] Title") and weekly ("Wed, May 13\n  • [event] Title") formats.
    const emojiRe = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u;
    const catPalette: Record<string, { bg: string; text: string; border: string }> = {
      exam:     { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-200" },
      holiday:  { bg: "bg-rose-100",    text: "text-rose-800",    border: "border-rose-200" },
      academic: { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-200" },
      cca:      { bg: "bg-violet-100",  text: "text-violet-800",  border: "border-violet-200" },
      event:    { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
    };
    const lines = item.message.split("\n");
    type Row = { kind: "day"; label: string } | { kind: "item"; cat: string; title: string };
    const rows: Row[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const bullet = line.match(/^•\s*(?:\[([a-z_]+)\]\s*)?(.+)$/i);
      if (bullet) {
        const cat = (bullet[1] || item.type || "event").toLowerCase();
        const title = bullet[2].replace(emojiRe, "").trim();
        rows.push({ kind: "item", cat, title });
      } else {
        rows.push({ kind: "day", label: line });
      }
    }
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
          <div className="mt-2 space-y-1.5">
            {rows.map((r, idx) =>
              r.kind === "day" ? (
                <p key={idx} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground pt-1">
                  {r.label}
                </p>
              ) : (
                <div key={idx} className="flex items-start gap-2">
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2 h-5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                      (catPalette[r.cat] || catPalette.event).bg
                    } ${(catPalette[r.cat] || catPalette.event).text} ${(catPalette[r.cat] || catPalette.event).border}`}
                  >
                    {r.cat}
                  </span>
                  <span className="text-xs text-foreground leading-5 break-words">{r.title}</span>
                </div>
              ),
            )}
          </div>
          {relativeLabel && (
            <span className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {relativeLabel}
            </span>
          )}
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
  // surfaced by the daily/weekly digests above. Sort so the latest is on top:
  // for attendance items use the parsed attendance date, otherwise created_at.
  const otherNotifications = filteredNotifications
    .filter((n) => !n.event_date)
    .slice()
    .sort(
      (a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      },
    );

  const renderItem = (notification: typeof filteredNotifications[number]) => {
    const Icon = getTypeIcon(notification.type);
    const hasLink = !!notification.link_to;

    // Derive attendance tag row (date + status) + clean message
    let tags: Array<{ label: string; className: string }> | undefined;
    let displayMessage = notification.message;
    if (notification.type === "attendance") {
      const statusMatch = notification.message.match(/\b(present|absent|late|excused)\b/i);
      const dateMatch = notification.message.match(/\bon\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/);
      const palette: Record<string, string> = {
        present: "bg-emerald-100 text-emerald-800 border-emerald-200",
        late:    "bg-amber-100 text-amber-800 border-amber-200",
        absent:  "bg-rose-100 text-rose-800 border-rose-200",
        excused: "bg-sky-100 text-sky-800 border-sky-200",
      };
      const built: Array<{ label: string; className: string }> = [];
      if (dateMatch) {
        built.push({
          label: dateMatch[1],
          className: "bg-white text-slate-800 border-slate-300 shadow-sm",
        });
      }
      if (statusMatch) {
        const status = statusMatch[1].toLowerCase();
        built.push({ label: status, className: palette[status] });
      }
      if (built.length > 0) tags = built;
      // Strip "is <status>" and "on <date>" from the displayed message
      displayMessage = notification.message
        .replace(/\s*is\s+(present|absent|late|excused)\b/i, "")
        .replace(/\s*on\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    return (
      <SwipeableNotification
        key={notification.id}
        id={notification.id}
        icon={<Icon className="h-5 w-5" />}
        iconBgClass={getTypeColor(notification.type)}
        title={notification.title}
        message={displayMessage}
        time={notification.time}
        isRead={notification.is_read}
        hasLink={hasLink}
        onClick={() => handleNotificationClick(notification)}
        onDelete={() => deleteNotification(notification.id)}
        tags={tags}
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
      </div>

      <div className="flex-1 px-4 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
            {(() => {
              type Entry =
                | { kind: "synthetic"; ts: number; item: typeof syntheticItems[number] }
                | { kind: "other"; ts: number; item: typeof otherNotifications[number] };
              const entries: Entry[] = [
                ...syntheticItems.map((item) => ({
                  kind: "synthetic" as const,
                  ts: parseSyntheticAnchorDate(item.id)?.getTime() ?? 0,
                  item,
                })),
                ...otherNotifications.map((item) => ({
                  kind: "other" as const,
                  ts: (() => {
                    if (!item.created_at) return 0;
                    const t = new Date(item.created_at).getTime();
                    return isNaN(t) ? 0 : t;
                  })(),
                  item,
                })),
              ].sort((a, b) => b.ts - a.ts);
              return entries.map((e) =>
                e.kind === "synthetic" ? renderSynthetic(e.item) : renderItem(e.item),
              );
            })()}

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
                  bar: "bg-rose-500",
                  pillBg: "bg-rose-100",
                  pillBorder: "border-rose-300",
                  monthText: "text-rose-600",
                  dayText: "text-rose-800",
                  label: "Holiday",
                },
                exam: {
                  bar: "bg-amber-500",
                  pillBg: "bg-amber-100",
                  pillBorder: "border-amber-300",
                  monthText: "text-amber-700",
                  dayText: "text-amber-900",
                  label: "Exam",
                },
                academic: {
                  bar: "bg-blue-500",
                  pillBg: "bg-blue-100",
                  pillBorder: "border-blue-300",
                  monthText: "text-blue-600",
                  dayText: "text-blue-800",
                  label: "Academic",
                },
                cca: {
                  bar: "bg-violet-500",
                  pillBg: "bg-violet-100",
                  pillBorder: "border-violet-300",
                  monthText: "text-violet-600",
                  dayText: "text-violet-800",
                  label: "CCA",
                },
                event: {
                  bar: "bg-emerald-500",
                  pillBg: "bg-emerald-100",
                  pillBorder: "border-emerald-300",
                  monthText: "text-emerald-700",
                  dayText: "text-emerald-800",
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
