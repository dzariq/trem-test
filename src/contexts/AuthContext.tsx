import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { setMirrored, removeMirrored, restoreMirrored } from "@/lib/native/storage";
import { registerPushAndSyncToken, unregisterPushTokenForUser } from "@/lib/native/pushNotifications";
import { supabase as supabaseClient } from "@/lib/supabase";

const PORTAL_KEY = "selected_portal";
const SESSION_START_KEY = "session_started_at";

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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portal, setPortalState] = useState<PortalType>(() => {
    const stored = localStorage.getItem(PORTAL_KEY);
    if (stored === "teacher" || stored === "family") return stored;
    return null;
  });

  // Rehydrate persisted keys from native Preferences if WebView storage was evicted.
  useEffect(() => {
    restoreMirrored([PORTAL_KEY, SESSION_START_KEY]).then(() => {
      const stored = localStorage.getItem(PORTAL_KEY);
      if (stored === "teacher" || stored === "family") {
        setPortalState((current) => current ?? stored);
      }
    });
  }, []);

  // Fetch profile + warm the user-roles cache in parallel so the login
  // redirect effect (which waits on both) doesn't pay two sequential RTTs.
  const fetchProfileAndRoles = useCallback(async (userId: string) => {
    const profilePromise = supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const rolesPromise = supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const [profileRes, rolesRes] = await Promise.all([profilePromise, rolesPromise]);

    if (profileRes.error) console.error("Error fetching profile:", profileRes.error);
    if (rolesRes.error) console.error("Error fetching roles:", rolesRes.error);

    // Prime react-query so useUserRoles resolves instantly.
    if (!rolesRes.error) {
      const roles = (rolesRes.data ?? []).map((r: any) => r.role);
      queryClient.setQueryData(["user-roles", userId], roles);
    }

    return (profileRes.data as UserProfile | null) ?? null;
  }, [queryClient]);

  // Set portal with localStorage persistence
  const setPortal = useCallback((newPortal: PortalType) => {
    setPortalState(newPortal);
    if (newPortal) {
      void setMirrored(PORTAL_KEY, newPortal);
    } else {
      void removeMirrored(PORTAL_KEY);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        console.log("[auth-debug] onAuthStateChange", { event, hasSession: !!currentSession, userId: currentSession?.user?.id });
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Invalidate any cached roles/profile data so a freshly signed-in
        // user (especially in the Android WebView) always re-fetches from
        // the network rather than reusing a stale react-query cache.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          queryClient.invalidateQueries({ queryKey: ["user-roles"] });
        }

        // When user signs out, clear profile
        if (event === "SIGNED_OUT") {
          // Best-effort: prevent previous user from receiving pushes.
          const prevUserId = user?.id;
          if (prevUserId) {
            void unregisterPushTokenForUser(prevUserId);
          }
          setProfile(null);
          void removeMirrored(SESSION_START_KEY);
          queryClient.clear();
          setLoading(false);
          return;
        }

        // Sessions no longer expire on the client side; Supabase auto-refreshes tokens.

        // When user signs in, fetch profile (using setTimeout to avoid deadlock)
        if (currentSession?.user) {
          // Register push token for this user on native builds.
          void registerPushAndSyncToken(currentSession.user.id);
          // Subscribe this user's existing device tokens to their FCM topics
          // (runs on web too; no-op server-side if there are no tokens/topics).
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            void supabaseClient.functions
              .invoke("fcm-subscribe-topics", { body: {} })
              .then(({ error }) => {
                if (error) console.warn("[auth] fcm-subscribe-topics failed", error);
              });
          }
          setTimeout(() => {
            fetchProfileAndRoles(currentSession.user.id).then((p) => {
              if (isMounted) {
                console.log("[auth-debug] fetchProfile(listener) result", { userId: currentSession.user.id, profileRole: p?.role ?? null, isActive: p?.is_active ?? null });
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

      console.log("[auth-debug] getSession(initial)", { hasSession: !!currentSession, userId: currentSession?.user?.id });
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void registerPushAndSyncToken(currentSession.user.id);
        void supabaseClient.functions
          .invoke("fcm-subscribe-topics", { body: {} })
          .then(({ error }) => {
            if (error) console.warn("[auth] fcm-subscribe-topics failed", error);
          });
        fetchProfileAndRoles(currentSession.user.id).then((p) => {
          if (isMounted) {
            console.log("[auth-debug] fetchProfile(initial) result", { userId: currentSession.user.id, profileRole: p?.role ?? null, isActive: p?.is_active ?? null });
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
    };
  }, [fetchProfileAndRoles, queryClient]);

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
      void removeMirrored(PORTAL_KEY);
      
      // Clear any other auth-related localStorage keys
      localStorage.removeItem("supabase.auth.token");
      void removeMirrored("active_campus_code");
      void removeMirrored(SESSION_START_KEY);
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
