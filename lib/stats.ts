import { getServiceClient, isSupabaseConfigured } from "./supabase-server";

const BASE_COUNT = 12400;

export async function getSignupCount(): Promise<number> {
  if (!isSupabaseConfigured()) return BASE_COUNT;
  try {
    const supabase = getServiceClient();
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    return BASE_COUNT + (count ?? 0);
  } catch {
    return BASE_COUNT;
  }
}
