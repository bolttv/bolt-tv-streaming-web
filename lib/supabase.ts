"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn("Supabase not configured - missing environment variables");
  }
  return supabase;
}

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "basic" | "premium";
  billing_period: "none" | "monthly" | "annual" | null;
  cleeng_customer_id: string | null;
  gender: string | null;
  birth_year: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
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
  if (!supabase) return null;
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
  if (!supabase) return null;
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
    return updateProfile(userId, updates);
  }

  return data;
}
