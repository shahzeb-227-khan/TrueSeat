import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Returns null when env vars are missing so pages never crash.
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}
