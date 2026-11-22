import { redirect } from "next/navigation";

import { getToday } from "@/core/planning/queries";

// /journal always opens today's page.
export default async function JournalIndex() {
  redirect(`/journal/${await getToday()}`);
}
