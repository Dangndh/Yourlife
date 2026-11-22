import { NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type TableName = keyof Database["public"]["Tables"];

/**
 * Every table, with the column used to page through it. Typed as a full Record, so adding a table
 * to the schema (and regenerating types) fails the build until it is added here too.
 */
const TABLES: Record<TableName, string> = {
  activity_logs: "id",
  attachments: "id",
  car_achievements: "id",
  car_jobs: "id",
  car_work_projects: "id",
  contacts: "id",
  events: "id",
  fam_responsibilities: "id",
  fin_accounts: "id",
  fin_asset_valuations: "id",
  fin_assets: "id",
  fin_budgets: "id",
  fin_categories: "id",
  fin_exchange_rates: "id",
  fin_transactions: "id",
  goals: "id",
  grw_experiences: "id",
  habit_checkins: "id",
  habits: "id",
  hlt_medical_records: "id",
  hlt_workouts: "id",
  journal_entries: "id",
  life_areas: "id",
  lrn_courses: "id",
  lrn_study_sessions: "id",
  metric_entries: "id",
  metrics: "id",
  profiles: "user_id",
  projects: "id",
  rel_event_contacts: "id",
  rel_interaction_contacts: "id",
  rel_interactions: "id",
  rel_milestones: "id",
  review_area_scores: "id",
  reviews: "id",
  skill_assessments: "id",
  skills: "id",
  taggings: "id",
  tags: "id",
  tasks: "id",
};

const PAGE = 1000;

/**
 * "Export all": one JSON file with every row you own (row level security limits it to you),
 * including soft-deleted rows. Uploaded files (attachments) are listed but not included.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tables: Record<string, unknown[]> = {};
  for (const [name, key] of Object.entries(TABLES) as [TableName, string][]) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from(name)
        .select("*")
        .order(key)
        .range(from, from + PAGE - 1);
      if (error) return NextResponse.json({ error: `export failed on ${name}` }, { status: 500 });
      rows.push(...data);
      if (data.length < PAGE) break;
    }
    tables[name] = rows;
  }

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({ app: "YourLife", format: 1, exported_at: exportedAt, tables }, null, 2);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="yourlife-backup-${exportedAt.slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
