import { useCallback, useEffect, useState } from "react";
import { getMyProfile, type UserProfile } from "@/data/profile";
import { supabase } from "@/lib/supabase";

type UseMyProfileResult = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMyProfile(): UseMyProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile.";
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        load();
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [load]);

  return { profile, loading, error, refetch: load };
}
