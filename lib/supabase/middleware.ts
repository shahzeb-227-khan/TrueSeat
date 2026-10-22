import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/api/health"];

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function matches(path: string, base: string) {
  return path === base || path.startsWith(base + "/");
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => matches(path, p));
  const isMfa = matches(path, "/mfa");
  const isApi = path.startsWith("/api/");
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  let signedIn = false;
  let aal2 = false;
  let hasFactor = false;

  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: CookieToSet[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = !!data.user;
      if (signedIn) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        aal2 = aal?.currentLevel === "aal2";
        hasFactor = aal?.nextLevel === "aal2";
      }
    } catch {
      signedIn = false;
      aal2 = false;
    }
  }

  const redirectTo = (p: string) => {
    const url = request.nextUrl.clone();
    url.pathname = p;
    url.search = "";
    return NextResponse.redirect(url);
  };
  const unauthorized = () =>
    NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!signedIn) {
    if (isPublic) return response;
    if (isApi) return unauthorized();
    return redirectTo("/sign-in");
  }

  if (!aal2) {
    if (path === "/api/health") return response;
    if (isApi) return unauthorized();
    if (hasFactor) {
      if (matches(path, "/mfa/challenge")) return response;
      return redirectTo("/mfa/challenge");
    }
    if (matches(path, "/mfa/enroll")) return response;
    return redirectTo("/mfa/enroll");
  }

  if (path === "/sign-in" || path === "/sign-up" || isMfa) {
    return redirectTo("/cases");
  }
  return response;
}
