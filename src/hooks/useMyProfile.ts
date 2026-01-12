import { useCallback, useEffect, useState } from "react";
import { getMyProfile, type UserProfile } from "@/data/profile";

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
  }, [load]);

  return { profile, loading, error, refetch: load };
}
