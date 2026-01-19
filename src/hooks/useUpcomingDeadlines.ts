import { useEffect, useState } from "react";
import { addDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { listUpcomingEvents } from "@/data/calendar";

export type UpcomingDeadlineItem = {
  id: string;
  title: string;
  dueAt: string;
  subtitle?: string;
  source: "examinations" | "calendar_events";
};

const logSupabaseError = (
  context: string,
  error: { code?: string; message?: string; details?: string; hint?: string }
) => {
  console.error(`[${context}]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
};

export function useUpcomingDeadlines(limit: number = 5) {
  const [items, setItems] = useState<UpcomingDeadlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      const now = new Date();
      const end = addDays(now, 30);
      const startIso = now.toISOString();
      const endIso = end.toISOString();

      try {
        const { data: exams, error: examsError } = await supabase
          .from("examinations")
          .select("id, exam_name, start_date, end_date")
          .gte("start_date", startIso)
          .lte("start_date", endIso)
          .order("start_date", { ascending: true });

        if (examsError) {
          logSupabaseError("useUpcomingDeadlines/examinations", examsError);
          throw examsError;
        }

        const examItems = (exams ?? [])
          .filter((row) => row.start_date || row.end_date)
          .map((row) => ({
            id: row.id,
            title: row.exam_name,
            dueAt: row.start_date || row.end_date || startIso,
            subtitle: row.end_date ? `Ends ${String(row.end_date).slice(0, 10)}` : undefined,
            source: "examinations" as const,
          }));

        if (examItems.length > 0) {
          if (isMounted) {
            setItems(examItems.slice(0, limit));
          }
          return;
        }

        const events = await listUpcomingEvents({ role: "teacher", limit: 20 });
        const filtered = events.filter((event) => {
          const category = event.category?.toLowerCase() || "";
          const title = event.title?.toLowerCase() || "";
          return category.includes("deadline") || category.includes("exam") || title.includes("deadline");
        });

        const eventItems = filtered
          .map((event) => ({
            id: String(event.id),
            title: event.title,
            dueAt: event.start?.toISOString() || `${event.date}T00:00:00`,
            subtitle: event.location || event.time,
            source: "calendar_events" as const,
          }))
          .slice(0, limit);

        if (isMounted) {
          setItems(eventItems);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load deadlines.";
        if (isMounted) {
          setError(message);
          setItems([]);
          toast({
            title: "Deadlines unavailable",
            description: "Unable to load upcoming deadlines.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { items, loading, error };
}
