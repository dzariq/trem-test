import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

type RuntimeDebugProps = {
  selectedStudentId: string | null;
  selectedYear: number | null;
};

type AuthSnapshot = {
  userId: string | null;
  hasSession: boolean;
};

const shouldShowDebug = () => {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  return window.localStorage?.getItem("DEBUG_MODE") === "1";
};

export function RuntimeDebug({ selectedStudentId, selectedYear }: RuntimeDebugProps) {
  const isVisible = useMemo(() => shouldShowDebug(), []);
  const [authSnapshot, setAuthSnapshot] = useState<AuthSnapshot>({
    userId: null,
    hasSession: false,
  });

  useEffect(() => {
    if (!isVisible) return;
    let isMounted = true;
    const loadAuth = async () => {
      const [{ data: sessionData }, { data: userData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);
      if (!isMounted) return;
      setAuthSnapshot({
        userId: userData.user?.id ?? null,
        hasSession: Boolean(sessionData.session),
      });
    };
    loadAuth();
    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
      <div className="font-semibold text-foreground mb-2">Runtime Debug</div>
      <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || "undefined"}</div>
      <div>Native Platform: {Capacitor.isNativePlatform() ? "true" : "false"}</div>
      <div>Auth User ID: {authSnapshot.userId || "none"}</div>
      <div>Session Exists: {authSnapshot.hasSession ? "true" : "false"}</div>
      <div>Selected Student ID: {selectedStudentId || "none"}</div>
      <div>Selected Year: {selectedYear ?? "none"}</div>
    </div>
  );
}
