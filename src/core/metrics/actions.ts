"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { zonedLocalToIso } from "@/core/planning/dates";
import { getTimeZone, getToday } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

export type MetricFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: number;
  values?: Record<string, string>;
  attempt?: number;
};

function fields(formData: FormData) {
  return Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string")) as Record<
    string,
    string
  >;
}

function failed(prev: MetricFormState, values: Record<string, string>, error: z.ZodError | string): MetricFormState {
  const base = { values, attempt: (prev.attempt ?? 0) + 1 };
  if (typeof error === "string") return { ...base, error };
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= "invalid";
  return { ...base, fieldErrors };
}

const optionalText = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((v) => (v ? v : null));

const metricSchema = z.object({
  name: z.string().trim().min(1).max(120),
  life_area_id: z.union([z.uuid(), z.literal("")]).transform((v) => (v ? v : null)),
  unit: optionalText,
  value_type: z.enum(["number", "duration", "currency", "percent", "rating"]).catch("number"),
  aggregation: z.enum(["last", "avg", "sum", "min", "max"]).catch("last"),
  direction: z.enum(["up", "down", "neutral"]).catch("up"),
  period: z
    .enum(["day", "week", "month", ""])
    .catch("")
    .transform((v) => (v ? v : null)),
});

export async function saveMetric(prev: MetricFormState, formData: FormData): Promise<MetricFormState> {
  const raw = fields(formData);
  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const id = z.uuid().safeParse(raw.id).success ? raw.id : null;
  const supabase = await createClient();

  if (id) {
    const { data: existing } = await supabase.from("metrics").select("source").eq("id", id).maybeSingle();
    if (!existing) return failed(prev, raw, "saveFailed");
    // Derived metrics are computed from module data: only their name and area can change.
    const row =
      existing.source === "derived"
        ? { name: parsed.data.name, life_area_id: parsed.data.life_area_id }
        : parsed.data;
    const { error } = await supabase.from("metrics").update(row).eq("id", id);
    if (error) return failed(prev, raw, "saveFailed");
    revalidatePath("/", "layout");
    redirect(`/metrics/${id}`);
  }

  const { data, error } = await supabase
    .from("metrics")
    .insert({ ...parsed.data, source: "manual" })
    .select("id")
    .single();
  if (error || !data) return failed(prev, raw, "saveFailed");
  revalidatePath("/", "layout");
  redirect(`/metrics/${data.id}`);
}

export async function setMetricArchived(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const archived = formData.get("archived") === "true";
  const supabase = await createClient();
  await supabase.from("metrics").update({ is_archived: archived }).eq("id", id);
  revalidatePath("/", "layout");
}

const entrySchema = z.object({
  metric_id: z.uuid(),
  value: z.coerce.number().finite(),
  date: z.iso.date(),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

/** Noon in the user's time zone: the entry lands on the chosen day whatever the server's zone. */
async function recordedAtFor(date: string) {
  return zonedLocalToIso(`${date}T12:00`, await getTimeZone());
}

export async function addEntry(prev: MetricFormState, formData: FormData): Promise<MetricFormState> {
  const raw = fields(formData);
  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const { metric_id, value, date, note } = parsed.data;
  if (date > (await getToday())) return { ...failed(prev, raw, "saveFailed"), error: undefined, fieldErrors: { date: "inFuture" } };
  const supabase = await createClient();
  const { data: metric } = await supabase.from("metrics").select("source").eq("id", metric_id).maybeSingle();
  if (metric?.source !== "manual") return failed(prev, raw, "saveFailed");
  const { error } = await supabase
    .from("metric_entries")
    .insert({ metric_id, value, note, recorded_at: await recordedAtFor(date) });
  if (error) return failed(prev, raw, "saveFailed");
  revalidatePath("/", "layout");
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function deleteEntry(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("metric_entries").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/", "layout");
}
