import { Capacitor } from "@capacitor/core";

export interface CcaReminderInput {
  sessionId: string;
  activityName: string;
  sessionDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM(:SS)
  role: "teacher" | "parent";
  link?: string | null;
  kindLabel?: "Club" | "Outdoor" | "Event" | "Sport";
}

const STORAGE_KEY = "cca-local-notif-ids";
const REMINDER_HOUR = 7; // 07:00 device-local

function hash31(input: string): number {
  // Simple deterministic 31-bit hash (avoids 32-bit signed overflow on iOS).
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h & 0x7fffffff;
}

function readScheduledIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function writeScheduledIds(ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function fireAt(sessionDate: string, daysBefore: number): Date | null {
  // sessionDate is YYYY-MM-DD in local time.
  const [y, m, d] = sessionDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const fire = new Date(y, m - 1, d, REMINDER_HOUR, 0, 0, 0);
  fire.setDate(fire.getDate() - daysBefore);
  return fire;
}

/**
 * Schedule T-3 and T-0 local notifications for the supplied CCA sessions.
 * Idempotent — re-running with the same session ids does not duplicate.
 * No-op on web.
 */
export async function scheduleCcaReminders(sessions: CcaReminderInput[]): Promise<number[]> {
  if (!Capacitor.isNativePlatform()) return [];

  let LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications;
  try {
    ({ LocalNotifications } = await import("@capacitor/local-notifications"));
  } catch {
    return [];
  }

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return [];
    }
  } catch {
    return [];
  }

  const now = new Date();
  const desired: Array<{
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
    extra: { url?: string | null };
  }> = [];

  for (const s of sessions) {
    for (const [trigger, daysBefore] of [
      ["t-3", 3],
      ["t-0", 0],
    ] as const) {
      const at = fireAt(s.sessionDate, daysBefore);
      if (!at) continue;
      if (at.getTime() <= now.getTime()) continue;
      const id = hash31(`${s.role}:${s.sessionId}:${trigger}`);
      const time = s.startTime ? ` at ${String(s.startTime).slice(0, 5)}` : "";
      const kind = s.kindLabel || "CCA";
      const title =
        trigger === "t-0"
          ? `${s.activityName} is today`
          : `${s.activityName} is in 3 days`;
      const body =
        trigger === "t-0"
          ? `${kind} session today${time}.`
          : `${kind} session in 3 days${time}.`;
      desired.push({
        id,
        title,
        body,
        schedule: { at },
        extra: { url: s.link ?? null },
      });
    }
  }

  const existing = new Set(readScheduledIds());
  const desiredIds = new Set(desired.map((d) => d.id));

  // Cancel scheduled ids that are no longer desired.
  const stale = Array.from(existing).filter((id) => !desiredIds.has(id));
  if (stale.length > 0) {
    try {
      await LocalNotifications.cancel({ notifications: stale.map((id) => ({ id })) });
    } catch {
      /* ignore */
    }
  }

  // Schedule any new ones (cancel-then-re-schedule for safety on date changes).
  if (desired.length > 0) {
    try {
      await LocalNotifications.cancel({
        notifications: desired.map((d) => ({ id: d.id })),
      });
    } catch {
      /* ignore */
    }
    try {
      await LocalNotifications.schedule({
        notifications: desired.map((d) => ({
          id: d.id,
          title: d.title,
          body: d.body,
          schedule: d.schedule,
          extra: d.extra,
          smallIcon: "ic_stat_icon_config_sample",
        })),
      });
    } catch (err) {
      console.warn("[ccaLocalNotifications] schedule failed", err);
    }
  }

  writeScheduledIds(Array.from(desiredIds));
  return Array.from(desiredIds);
}