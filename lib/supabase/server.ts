import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// User-token client for route handlers. Uses the signed-in user's cookies so RLS applies.
// Never use the service-role key here.
export function createServerSupabase() {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a read-only context; middleware refreshes the session.
        }
      },
    },
  });
}
