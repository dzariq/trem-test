import { useEffect, useMemo, useState } from "react";
import { useCampus } from "@/contexts/CampusContext";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";
import {
  buildHolidayDateSet,
  fetchHolidayEventsForRange,
  holidaySetKey,
} from "@/lib/attendanceCalendar";

/**
 * Fetches calendar holidays for the given date range and returns a stable
 * Set<string> of YYYY-MM-DD keys + a serialized cache key.
 */
export function useAttendanceHolidaySet(
  start: Date | null,
  end: Date | null,
) {
  const { activeCampus } = useCampus();
  const resumeTick = useResumeTick();
  const [holidaySet, setHolidaySet] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);

  const startKey = start ? start.toISOString().slice(0, 10) : "";
  const endKey = end ? end.toISOString().slice(0, 10) : "";

  useEffect(() => {
    if (!start || !end) {
      setHolidaySet(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchHolidayEventsForRange(start, end, activeCampus)
      .then((events) => {
        if (cancelled) return;
        setHolidaySet(buildHolidayDateSet(events, start, end));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey, activeCampus, resumeTick]);

  const key = useMemo(() => holidaySetKey(holidaySet), [holidaySet]);
  return { holidaySet, holidayKey: key, loading };
}