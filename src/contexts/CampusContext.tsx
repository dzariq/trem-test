import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "active_campus_code";
const isNativeApp = Capacitor.isNativePlatform();

export type CampusInfo = {
  campus_code: string;
  name: string;
  is_primary: boolean;
};

type CampusContextType = {
  activeCampus: string | null;
  campuses: CampusInfo[];
  setActiveCampus: (code: string) => void;
  isMultiCampus: boolean;
  loading: boolean;
};

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const readStoredCampus = async (): Promise<string | null> => {
  if (isNativeApp) {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value ?? null;
  }
  return localStorage.getItem(STORAGE_KEY);
};

const writeStoredCampus = async (code: string | null) => {
  if (isNativeApp) {
    if (code === null) {
      await Preferences.remove({ key: STORAGE_KEY });
    } else {
      await Preferences.set({ key: STORAGE_KEY, value: code });
    }
    return;
  }
  if (code === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, code);
  }
};

export function CampusProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [campuses, setCampuses] = useState<CampusInfo[]>([]);
  const [activeCampus, setActiveCampusState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = profile?.role === "teacher";

  // Fetch teacher campuses on auth load
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isTeacher) {
      setCampuses([]);
      setActiveCampusState(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadCampuses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_campuses")
          .select("campus_code, is_primary, campuses(name)")
          .eq("user_id", user.id)
          .order("is_primary", { ascending: false });

        if (error) {
          console.error("[CampusContext] fetch error:", error);
          if (isMounted) setLoading(false);
          return;
        }

        const mapped: CampusInfo[] = (data ?? []).map((row: any) => ({
          campus_code: row.campus_code,
          name: (row.campuses as any)?.name ?? row.campus_code,
          is_primary: Boolean(row.is_primary),
        }));

        if (!isMounted) return;
        setCampuses(mapped);

        if (mapped.length === 0) {
          setActiveCampusState(null);
          setLoading(false);
          return;
        }

        // Restore from storage or default to primary
        const stored = await readStoredCampus();
        const validCodes = new Set(mapped.map((c) => c.campus_code));

        if (stored && validCodes.has(stored)) {
          setActiveCampusState(stored);
        } else {
          const primary = mapped.find((c) => c.is_primary)?.campus_code ?? mapped[0].campus_code;
          setActiveCampusState(primary);
          await writeStoredCampus(primary);
        }
      } catch (err) {
        console.error("[CampusContext] unexpected error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCampuses();
    return () => { isMounted = false; };
  }, [authLoading, user, isTeacher]);

  // For parents: loading is done once auth is done (campus derived from child)
  useEffect(() => {
    if (authLoading) return;
    if (!isTeacher && user) {
      setLoading(false);
    }
  }, [authLoading, isTeacher, user]);

  const setActiveCampus = useCallback((code: string) => {
    setActiveCampusState(code);
    writeStoredCampus(code);
    // Invalidate all queries to refresh with new campus
    queryClient.invalidateQueries();
  }, [queryClient]);

  const isMultiCampus = campuses.length > 1;

  const value = useMemo(() => ({
    activeCampus,
    campuses,
    setActiveCampus,
    isMultiCampus,
    loading,
  }), [activeCampus, campuses, setActiveCampus, isMultiCampus, loading]);

  return (
    <CampusContext.Provider value={value}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error("useCampus must be used within a CampusProvider");
  }
  return context;
}
