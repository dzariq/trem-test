import { supabase } from "@/lib/supabase";

export type UserProfile = {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  staff_id?: string | null;
  role: string;
  assigned_campus_id: string | null;
  campus_id?: string | null; // Alias for assigned_campus_id for compatibility
  can_access_all_campuses?: boolean | null;
  is_active?: boolean | null;
  parent_relationship?: string | null;
  parent_relationship_other?: string | null;
};

export async function getMyProfile(): Promise<UserProfile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error("No authenticated user found.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }
  if (!profile) {
    throw new Error("Account profile not found.");
  }

  return profile as UserProfile;
}

export async function updateMyProfile(updates: {
  full_name?: string | null;
  phone?: string | null;
  parent_relationship?: string | null;
  parent_relationship_other?: string | null;
}): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }
  if (!userData.user) {
    throw new Error("No authenticated user found.");
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }
}
