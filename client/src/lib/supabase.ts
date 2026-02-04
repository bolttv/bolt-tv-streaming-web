import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "basic" | "premium";
  cleeng_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

export async function upsertProfile(
  userId: string,
  email: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  // Try to upsert (insert or update) the profile
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: email,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting profile:", error);
    // Try a simple update as fallback
    return updateProfile(userId, updates);
  }

  return data;
}
