import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const PORTAL_KEY = "selected_portal";
const SESSION_START_KEY = "session_started_at";
const SESSION_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

export type PortalType = "teacher" | "family" | null;

type UserProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  portal: PortalType;
  setPortal: (portal: PortalType) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portal, setPortalState] = useState<PortalType>(() => {
    const stored = localStorage.getItem(PORTAL_KEY);
    if (stored === "teacher" || stored === "family") return stored;
    return null;
  });

  // Function to fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }, []);

  // Set portal with localStorage persistence
  const setPortal = useCallback((newPortal: PortalType) => {
    setPortalState(newPortal);
    if (newPortal) {
      localStorage.setItem(PORTAL_KEY, newPortal);
    } else {
      localStorage.removeItem(PORTAL_KEY);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;

    const forceSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Forced sign-out error:", e);
      }
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(PORTAL_KEY);
      if (isMounted) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setPortalState(null);
      }
    };

    const scheduleExpiry = () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      const startedAt = Number(localStorage.getItem(SESSION_START_KEY) || 0);
      if (!startedAt) return;
      const remaining = startedAt + SESSION_MAX_AGE_MS - Date.now();
      if (remaining <= 0) {
        forceSignOut();
      } else {
        // setTimeout max ~24.8 days, 48h is fine
        expiryTimer = setTimeout(forceSignOut, remaining);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // When user signs out, clear profile
        if (event === "SIGNED_OUT") {
          setProfile(null);
          localStorage.removeItem(SESSION_START_KEY);
          if (expiryTimer) clearTimeout(expiryTimer);
          setLoading(false);
          return;
        }

        // Stamp session start on fresh sign-in (not on token refresh)
        if (event === "SIGNED_IN" && currentSession?.user) {
          if (!localStorage.getItem(SESSION_START_KEY)) {
            localStorage.setItem(SESSION_START_KEY, String(Date.now()));
          }
          scheduleExpiry();
        }

        // When user signs in, fetch profile (using setTimeout to avoid deadlock)
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then((p) => {
              if (isMounted) {
                setProfile(p);
                setLoading(false);
              }
            });
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Enforce 48h absolute expiry on existing session
        const startedAt = Number(localStorage.getItem(SESSION_START_KEY) || 0);
        if (!startedAt) {
          // No stamp (legacy session) — stamp now so policy applies going forward
          localStorage.setItem(SESSION_START_KEY, String(Date.now()));
        } else if (Date.now() - startedAt >= SESSION_MAX_AGE_MS) {
          forceSignOut();
          return;
        }
        scheduleExpiry();

        fetchProfile(currentSession.user.id).then((p) => {
          if (isMounted) {
            setProfile(p);
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (expiryTimer) clearTimeout(expiryTimer);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all auth-related state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear portal selection
      setPortalState(null);
      localStorage.removeItem(PORTAL_KEY);
      
      // Clear any other auth-related localStorage keys
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("active_campus_code");
      localStorage.removeItem(SESSION_START_KEY);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, portal, setPortal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
