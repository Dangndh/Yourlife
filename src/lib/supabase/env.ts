// Public values only. Never put the service_role key in NEXT_PUBLIC_* variables.
//
// Accept every name the Supabase ↔ Vercel integration (or a manual setup) may use.
// NEXT_PUBLIC_* values are inlined at build time and are the only ones the browser sees;
// the server-only names are a fallback for server code and the proxy.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

/** Names of the settings that are missing, for a readable error instead of a blank 500. */
export function missingSupabaseEnv(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}
