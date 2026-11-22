"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type JournalFormState = { error?: string; savedAt?: string };

const rating = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const journalSchema = z.object({
  entry_date: z.iso.date(),
  body: z.string().max(100_000).default(""),
  mood: rating,
  energy: rating,
  is_private: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

/** One daily entry per date: update it if it exists, otherwise create it. */
export async function saveJournal(_prev: JournalFormState, formData: FormData): Promise<JournalFormState> {
  const parsed = journalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { entry_date, ...values } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("kind", "daily")
    .eq("entry_date", entry_date)
    .is("deleted_at", null)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("journal_entries").update(values).eq("id", existing.id)
    : await supabase.from("journal_entries").insert({ ...values, entry_date, kind: "daily" });
  if (error) return { error: "saveFailed" };

  revalidatePath("/journal", "layout");
  revalidatePath("/");
  return { savedAt: new Date().toISOString() };
}
