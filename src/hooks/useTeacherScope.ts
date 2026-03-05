import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "teacher_selected_class_year_id";

type ClassYear = {
  id: number;
  class_name: string;
  year_level: string;
  active: boolean;
  campus_code: string | null;
};

type SubjectInfo = {
  id: number;
  name: string;
  year_levels: string[] | null;
};

const classYearsCache = new Map<string, ClassYear[]>();
const subjectsCache = new Map<string, Map<number, SubjectInfo[]>>();
const inFlightClassYears = new Map<string, Promise<ClassYear[]>>();
const inFlightSubjects = new Map<string, Map<number, Promise<SubjectInfo[]>>>();

const isNativeApp = Capacitor.isNativePlatform();

const readStoredClassYearId = async (): Promise<number | null> => {
  if (isNativeApp) {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
};

const writeStoredClassYearId = async (value: number | null) => {
  if (isNativeApp) {
    if (value === null) {
      await Preferences.remove({ key: STORAGE_KEY });
      return;
    }
    await Preferences.set({ key: STORAGE_KEY, value: String(value) });
    return;
  }
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }
};

const logSupabaseError = (context: string, error: { code?: string; message?: string; details?: string; hint?: string }) => {
  console.error(`[${context}]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
};

export function useTeacherScope() {
  const { user, profile, loading: authLoading } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const userId = user?.id ?? null;

  const [allowedClassYears, setAllowedClassYears] = useState<ClassYear[]>([]);
  const [selectedClassYearId, setSelectedClassYearIdState] = useState<number | null>(null);
  const [subjectsByClassYearId, setSubjectsByClassYearId] = useState<Record<number, SubjectInfo[]>>({});
  const [subjectsLoadingByClassYearId, setSubjectsLoadingByClassYearId] = useState<Record<number, boolean>>({});
  const [subjectsErrorByClassYearId, setSubjectsErrorByClassYearId] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializedSelectionRef = useRef(false);
  const lastSelectionRef = useRef<number | null>(null);

  const selectedClassYear = useMemo(() => {
    if (!selectedClassYearId) return null;
    return allowedClassYears.find((cls) => cls.id === selectedClassYearId) ?? null;
  }, [allowedClassYears, selectedClassYearId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isTeacher || !userId) {
      setAllowedClassYears([]);
      setSelectedClassYearIdState(null);
      return;
    }

    let isMounted = true;
    const loadClassYears = async () => {
      const cached = classYearsCache.get(userId);
      if (cached) {
        if (isMounted) {
          setAllowedClassYears(cached);
        }
        return;
      }

      const inflight = inFlightClassYears.get(userId);
      if (inflight) {
        try {
          const data = await inflight;
          if (isMounted) setAllowedClassYears(data);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load classes.";
          if (isMounted) {
            setError(message);
            setAllowedClassYears([]);
          }
        }
        return;
      }

      setLoading(true);
      setError(null);

      const fetchPromise = (async () => {
        const { data, error: queryError } = await supabase
          .from("class_years")
          .select("id, class_name, year_level, active, campus_code, teacher_assignments!inner(teacher_id)")
          .eq("teacher_assignments.teacher_id", userId)
          .eq("active", true)
          .order("year_level", { ascending: true })
          .order("class_name", { ascending: true });

        if (queryError) {
          logSupabaseError("useTeacherScope/class_years", queryError);
          throw queryError;
        }

        const unique = new Map<number, ClassYear>();
        (data ?? []).forEach((row) => {
          if (row && typeof row.id === "number") {
            unique.set(row.id, {
              id: row.id,
              class_name: row.class_name,
              year_level: row.year_level,
              active: row.active,
              campus_code: (row as any).campus_code ?? null,
            });
          }
        });
        return Array.from(unique.values());
      })();

      inFlightClassYears.set(userId, fetchPromise);

      try {
        const result = await fetchPromise;
        classYearsCache.set(userId, result);
        if (isMounted) setAllowedClassYears(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load classes.";
        if (isMounted) {
          setError(message);
          setAllowedClassYears([]);
          toast({
            title: "Unable to load classes",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        inFlightClassYears.delete(userId);
        if (isMounted) setLoading(false);
      }
    };

    loadClassYears();
    return () => {
      isMounted = false;
    };
  }, [authLoading, isTeacher, userId]);

  useEffect(() => {
    if (!isTeacher) return;
    if (authLoading) return;
    if (loading) return;

    if (allowedClassYears.length === 0) {
      setSelectedClassYearIdState(null);
      return;
    }

    const ensureSelection = async () => {
      const stored = await readStoredClassYearId();
      const allowedIds = new Set(allowedClassYears.map((cls) => cls.id));

      if (initializedSelectionRef.current) {
        if (selectedClassYearId && !allowedIds.has(selectedClassYearId)) {
          const nextId = allowedClassYears[0]?.id ?? null;
          if (nextId !== null) {
            setSelectedClassYearIdState(nextId);
            toast({
              title: "Class updated",
              description: "Your selected class is no longer available.",
            });
          }
        }
        return;
      }

      initializedSelectionRef.current = true;

      if (stored && allowedIds.has(stored)) {
        setSelectedClassYearIdState(stored);
        return;
      }

      const defaultId = allowedClassYears[0]?.id ?? null;
      if (defaultId !== null) {
        setSelectedClassYearIdState(defaultId);
      }
    };

    ensureSelection();
  }, [allowedClassYears, authLoading, isTeacher, loading, selectedClassYearId]);

  useEffect(() => {
    if (!isTeacher) return;
    if (selectedClassYearId === lastSelectionRef.current) return;
    lastSelectionRef.current = selectedClassYearId;
    void writeStoredClassYearId(selectedClassYearId);
  }, [isTeacher, selectedClassYearId]);

  const setSelectedClassYearId = useCallback(
    (value: number | null) => {
      if (!isTeacher) {
        setSelectedClassYearIdState(value);
        return;
      }
      if (value === null) {
        setSelectedClassYearIdState(null);
        return;
      }
      const exists = allowedClassYears.some((cls) => cls.id === value);
      if (!exists) {
        toast({
          title: "Class not available",
          description: "Please select an assigned class.",
          variant: "destructive",
        });
        return;
      }
      setSelectedClassYearIdState(value);
    },
    [allowedClassYears, isTeacher]
  );

  const getAllowedSubjects = useCallback(
    async (classYearId: number): Promise<SubjectInfo[]> => {
      if (!isTeacher || !userId) return [];

      const userCache = subjectsCache.get(userId) ?? new Map<number, SubjectInfo[]>();
      subjectsCache.set(userId, userCache);

      const cached = userCache.get(classYearId);
      if (cached) {
        setSubjectsByClassYearId((prev) => ({ ...prev, [classYearId]: cached }));
        return cached;
      }

      const inflightByUser = inFlightSubjects.get(userId) ?? new Map<number, Promise<SubjectInfo[]>>();
      inFlightSubjects.set(userId, inflightByUser);

      const inflight = inflightByUser.get(classYearId);
      if (inflight) {
        try {
          const result = await inflight;
          setSubjectsByClassYearId((prev) => ({ ...prev, [classYearId]: result }));
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load subjects.";
          setSubjectsErrorByClassYearId((prev) => ({ ...prev, [classYearId]: message }));
          return [];
        }
      }

      setSubjectsLoadingByClassYearId((prev) => ({ ...prev, [classYearId]: true }));
      setSubjectsErrorByClassYearId((prev) => ({ ...prev, [classYearId]: null }));

      const fetchPromise = (async () => {
        const { data, error: queryError } = await supabase
          .from("subjects")
          .select("id, name, year_levels, teacher_assignments!inner(teacher_id, class_year_id)")
          .eq("teacher_assignments.teacher_id", userId)
          .eq("teacher_assignments.class_year_id", classYearId)
          .order("name", { ascending: true });

        if (queryError) {
          logSupabaseError("useTeacherScope/subjects", queryError);
          throw queryError;
        }

        const unique = new Map<number, SubjectInfo>();
        (data ?? []).forEach((row) => {
          if (row && typeof row.id === "number") {
            unique.set(row.id, {
              id: row.id,
              name: row.name,
              year_levels: row.year_levels ?? null,
            });
          }
        });
        return Array.from(unique.values());
      })();

      inflightByUser.set(classYearId, fetchPromise);

      try {
        const result = await fetchPromise;
        userCache.set(classYearId, result);
        setSubjectsByClassYearId((prev) => ({ ...prev, [classYearId]: result }));
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load subjects.";
        setSubjectsErrorByClassYearId((prev) => ({ ...prev, [classYearId]: message }));
        toast({
          title: "Unable to load subjects",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        return [];
      } finally {
        inflightByUser.delete(classYearId);
        setSubjectsLoadingByClassYearId((prev) => ({ ...prev, [classYearId]: false }));
      }
    },
    [isTeacher, userId]
  );

  return {
    allowedClassYears,
    selectedClassYearId,
    selectedClassYear,
    setSelectedClassYearId,
    subjectsByClassYearId,
    subjectsLoadingByClassYearId,
    subjectsErrorByClassYearId,
    getAllowedSubjects,
    loading: authLoading || loading,
    error,
    isTeacher,
  };
}
