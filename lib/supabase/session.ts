import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const getSupabaseSession = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session;
});

export const getSupabaseUser = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
});
