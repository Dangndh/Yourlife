"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; email?: string };

const schema = z.object({
  email: z.email(),
  next: z.string().startsWith("/").default("/"),
});

/** The site the user is on (production, a Vercel preview or localhost), so auth returns to it. */
async function siteUrl() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function callbackUrl(site: string, next: string) {
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return `${site}/auth/callback?next=${encodeURIComponent(safe)}`;
}

/** Google sign-in. Needs the Google provider turned on in Supabase → Authentication → Sign In / Providers. */
export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") || "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(await siteUrl(), next) },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || "/",
  });
  if (!parsed.success) return { status: "error" };

  const supabase = await createClient();
  // The link returns to the site the user is on. That URL must be allowed in
  // Supabase → Authentication → URL Configuration → Redirect URLs.
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl(await siteUrl(), parsed.data.next),
    },
  });

  return error ? { status: "error" } : { status: "sent", email: parsed.data.email };
}
