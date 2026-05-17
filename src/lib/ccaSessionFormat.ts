import { format, parseISO, isAfter, startOfDay } from "date-fns";
import type { CcaSession } from "@/hooks/useEligibleCcaActivities";

/** Return the next non-cancelled session (today or later) sorted ascending. */
export function getNextUpcomingSession(sessions: CcaSession[] | undefined | null): CcaSession | null {
  const upcoming = getUpcomingSessions(sessions);
  return upcoming[0] ?? null;
}

/** Return up to `limit` non-cancelled sessions from today onwards, ascending. */
export function getUpcomingSessions(
  sessions: CcaSession[] | undefined | null,
  limit = 3,
): CcaSession[] {
  if (!sessions || sessions.length === 0) return [];
  const today = startOfDay(new Date());
  return sessions
    .filter((s) => !s.isCancelled && s.sessionDate)
    .filter((s) => {
      try {
        return !isAfter(today, parseISO(s.sessionDate as string));
      } catch {
        return false;
      }
    })
    .sort((a, b) => (a.sessionDate ?? "").localeCompare(b.sessionDate ?? ""))
    .slice(0, limit);
}

/** "Sat, 23 May" */
export function formatSessionDateShort(sessionDate: string | null | undefined): string {
  if (!sessionDate) return "TBA";
  try {
    return format(parseISO(sessionDate), "EEE, d MMM");
  } catch {
    return sessionDate;
  }
}

/** "9:00 AM" — accepts "HH:mm" or "HH:mm:ss". */
export function formatSessionTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const minute = Number(m ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/** "9:00 AM – 10:30 AM" or single time. */
export function formatSessionTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = formatSessionTime(start);
  const e = formatSessionTime(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

export const CCA_BUCKET_LABEL: Record<"clubs" | "outdoor" | "events", string> = {
  clubs: "Club",
  outdoor: "Outdoor",
  events: "Event",
};