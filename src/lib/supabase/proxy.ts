import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { missingSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

const PUBLIC_PATHS = ["/login", "/auth"];

/** Refreshes the Supabase session cookie and sends signed-out visitors to /login. */
export async function updateSession(request: NextRequest) {
  const missing = missingSupabaseEnv();
  if (missing.length > 0) {
    console.error(`[yourlife] Missing environment variables: ${missing.join(", ")}`);
    return new NextResponse(
      `YourLife is not configured yet. Missing environment variables: ${missing.join(", ")}.\n` +
        "Add them in Vercel → Project → Settings → Environment Variables, then redeploy.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not run code between createServerClient and getUser(): it can log users out at random.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (error) {
    // Supabase unreachable or misconfigured: treat as signed out instead of crashing every page.
    console.error("[yourlife] supabase.auth.getUser failed", error);
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
