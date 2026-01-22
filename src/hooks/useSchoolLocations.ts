import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SchoolLocation {
  id: string;
  name: string;
  building: string | null;
  locationType: string | null;
  capacity: number | null;
}

export function useSchoolLocations() {
  const [locations, setLocations] = useState<SchoolLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("school_locations")
        .select("id, name, building, location_type, capacity")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: SchoolLocation[] = (data || []).map((loc) => ({
        id: loc.id,
        name: loc.name,
        building: loc.building,
        locationType: loc.location_type,
        capacity: loc.capacity,
      }));

      setLocations(mapped);
    } catch (err: any) {
      console.error("[useSchoolLocations] fetchLocations error:", err);
      setError(err?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
  };
}
