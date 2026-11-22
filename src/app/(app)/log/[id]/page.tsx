import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { LogEditForm } from "@/components/activity/log-form";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/planning/delete-button";
import { deleteLog } from "@/core/activity/actions";
import { getLog } from "@/core/activity/queries";
import { getAreas, getTimeZone } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("log");
  return { title: t("edit") };
}

/** "YYYY-MM-DDTHH:mm" of an instant in a time zone, for <input type="datetime-local">. */
function localInput(iso: string, timeZone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export default async function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const [log, areas, timeZone] = await Promise.all([getLog(id), getAreas(), getTimeZone()]);
  // Logs written by the app from other records (done tasks, workouts…) are changed at their source.
  if (!log || log.source_table) notFound();

  return (
    <>
      <PageHeader title={t("log.edit")} back={{ href: "/log", label: t("log.title") }} />
      <div className="flex flex-col gap-8">
        <LogEditForm log={log} areas={areas} occurredLocal={localInput(log.occurred_at, timeZone)} />
        <DeleteButton action={deleteLog} id={log.id} label={t("log.delete")} />
      </div>
    </>
  );
}
