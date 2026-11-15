"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; email?: string };

const schema = z.object({
  email: z.email(),
  next: z.string().startsWith("/").default("/"),
});

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || "/",
  });
  if (!parsed.success) return { status: "error" };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(parsed.data.next)}`,
    },
  });

  return error ? { status: "error" } : { status: "sent", email: parsed.data.email };
}
