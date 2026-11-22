import { createClient } from "@/lib/supabase/server";

export type JournalEntry = {
  id: string;
  entry_date: string;
  body: string;
  mood: number | null;
  energy: number | null;
  is_private: boolean;
  updated_at: string;
};

const COLS = "id, entry_date, body, mood, energy, is_private, updated_at";

export async function getDailyEntry(date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select(COLS)
    .eq("kind", "daily")
    .eq("entry_date", date)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as JournalEntry | null) ?? null;
}

export async function getRecentEntries(limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select(COLS)
    .eq("kind", "daily")
    .is("deleted_at", null)
    .order("entry_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as JournalEntry[];
}
