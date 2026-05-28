import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

/**
 * Persists the public-facing Notes body for an event-style CCA activity.
 * Stored on `cca_activities.public_description` so the existing parent
 * surface picks it up unchanged.
 */
export function useCcaActivityNotes() {
  const [saving, setSaving] = useState(false);

  const saveNotes = useCallback(
    async (activityId: string, body: string): Promise<boolean> => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("cca_activities")
          .update({ public_description: body || null })
          .eq("id", activityId);
        if (error) {
          if (/row-level security/i.test(error.message)) {
            toast({
              title: "Permission Denied",
              description:
                "Only PIC teachers or admins can edit event notes.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Could not save notes",
              description: error.message,
              variant: "destructive",
            });
          }
          return false;
        }
        toast({ title: "Notes saved" });
        return true;
      } catch (e: any) {
        toast({
          title: "Could not save notes",
          description: e?.message || "Try again later.",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { saving, saveNotes };
}