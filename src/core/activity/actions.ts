"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { zonedLocalToIso } from "@/core/planning/dates";
import { getTimeZone } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

export type LogFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: number;
  values?: Record<string, string>;
  attempt?: number;
};

const logSchema = z.object({
  life_area_id: z.uuid(),
  title: z.string().trim().min(1).max(500),
  notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((v) => (v ? v : null)),
  duration_min: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(24 * 60)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  // "YYYY-MM-DDTHH:mm" in the user's time zone; empty = now
  occurred_local: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)])
    .optional(),
});

function fields(formData: FormData) {
  return Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string")) as Record<
    string,
    string
  >;
}

async function parse(raw: Record<string, string>, prev: LogFormState) {
  const parsed = logSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= "invalid";
    return { fail: { fieldErrors, values: raw, attempt: (prev.attempt ?? 0) + 1 } as LogFormState };
  }
  const { occurred_local, ...rest } = parsed.data;
  const occurred_at = occurred_local ? zonedLocalToIso(occurred_local, await getTimeZone()) : new Date().toISOString();
  if (new Date(occurred_at).getTime() > Date.now() + 5 * 60 * 1000) {
    return { fail: { fieldErrors: { occurred_local: "inFuture" }, values: raw, attempt: (prev.attempt ?? 0) + 1 } };
  }
  return { row: { ...rest, occurred_at } };
}

/** Quick Log: one line about what you did. Stays open-ended so it can be used from anywhere. */
export async function quickLog(prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const raw = fields(formData);
  const { row, fail } = await parse(raw, prev);
  if (!row) return fail!;
  const supabase = await createClient();
  const { error } = await supabase.from("activity_logs").insert(row);
  if (error) return { error: "saveFailed", values: raw, attempt: (prev.attempt ?? 0) + 1 };
  revalidatePath("/", "layout");
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function updateLog(prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const raw = fields(formData);
  const id = z.uuid().safeParse(raw.id);
  if (!id.success) return { error: "saveFailed" };
  const { row, fail } = await parse(raw, prev);
  if (!row) return fail!;
  const supabase = await createClient();
  // RLS only lets the user change their own manual logs (source_table is null).
  const { error } = await supabase.from("activity_logs").update(row).eq("id", id.data).is("source_table", null);
  if (error) return { error: "saveFailed", values: raw, attempt: (prev.attempt ?? 0) + 1 };
  revalidatePath("/", "layout");
  redirect("/log");
}

export async function deleteLog(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("activity_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("source_table", null);
  revalidatePath("/", "layout");
  redirect("/log");
}
