"use client";

import { createContext, useActionState, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { areaName } from "@/components/planning/area-name";
import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { quickLog, type LogFormState } from "@/core/activity/actions";
import type { AreaOption } from "@/core/types";
import { cn } from "@/lib/utils";

type Ctx = { open: () => void };
const QuickLogContext = createContext<Ctx>({ open: () => {} });
export const useQuickLog = () => useContext(QuickLogContext);

const DURATIONS = [15, 30, 60, 90];

/** Wraps the signed-in app: one Quick Log sheet, opened by any button or the L key. */
export function QuickLogProvider({ areas, children }: { areas: AreaOption[]; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const open = useCallback(() => {
    setSession((s) => s + 1); // fresh form each time
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "l" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <QuickLogContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {isOpen && <QuickLogSheet key={session} areas={areas} onDone={() => setOpen(false)} />}
      </Dialog>
    </QuickLogContext.Provider>
  );
}

function QuickLogSheet({ areas, onDone }: { areas: AreaOption[]; onDone: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [state, action, pending] = useActionState<LogFormState, FormData>(quickLog, {});
  const [duration, setDuration] = useState(state.values?.duration_min ?? "");
  const [showMore, setShowMore] = useState(false);
  const e = state.fieldErrors ?? {};

  // Default area = the area page you are on, else the first one.
  const currentKey = pathname.split("/")[1];
  const defaultArea = areas.find((a) => a.key === currentKey)?.id ?? areas[0]?.id;

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <DialogContent closeLabel={t("planning.cancel")}>
      <DialogHeader>
        <DialogTitle>{t("log.quickLog")}</DialogTitle>
        <DialogDescription>{t("log.quickLogHint")}</DialogDescription>
      </DialogHeader>
      <form key={state.attempt ?? 0} action={action} className="flex flex-col gap-4">
        <Field id="ql-title" label={t("log.what")} error={e.title}>
          <Input
            id="ql-title"
            name="title"
            required
            maxLength={500}
            autoFocus
            autoComplete="off"
            placeholder={t("log.whatPlaceholder")}
            defaultValue={state.values?.title}
          />
        </Field>
        <Field id="ql-area" label={t("planning.fields.area")} error={e.life_area_id}>
          <NativeSelect id="ql-area" name="life_area_id" required defaultValue={state.values?.life_area_id ?? defaultArea}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {areaName(t, a)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="ql-duration" label={t("log.duration")} error={e.duration_min}>
          <div className="flex flex-wrap items-center gap-2">
            {DURATIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(duration === String(m) ? "" : String(m))}
                aria-pressed={duration === String(m)}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm",
                  duration === String(m) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                )}
              >
                {t("log.minutes", { count: m })}
              </button>
            ))}
            <Input
              id="ql-duration"
              name="duration_min"
              type="number"
              inputMode="numeric"
              min={0}
              max={1440}
              value={duration}
              onChange={(ev) => setDuration(ev.target.value)}
              placeholder={t("log.minutesShort")}
              className="w-24"
            />
          </div>
        </Field>
        {showMore || state.values?.occurred_local || state.values?.notes ? (
          <>
            <Field id="ql-when" label={t("log.when")} hint={t("log.whenHint")} error={e.occurred_local}>
              <Input id="ql-when" name="occurred_local" type="datetime-local" defaultValue={state.values?.occurred_local} />
            </Field>
            <Field id="ql-notes" label={t("planning.fields.notes")} error={e.notes}>
              <Textarea id="ql-notes" name="notes" rows={3} defaultValue={state.values?.notes} />
            </Field>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-muted-foreground hover:text-foreground w-fit text-sm underline-offset-4 hover:underline"
          >
            {t("log.more")}
          </button>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
            {t("log.save")}
          </Button>
          <FormError error={state.error} />
        </div>
      </form>
    </DialogContent>
  );
}

/** Desktop sidebar button. */
export function QuickLogButton({ label, shortcut }: { label: string; shortcut: string }) {
  const { open } = useQuickLog();
  return (
    <button
      type="button"
      onClick={open}
      className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
    >
      <Plus className="size-4" />
      <span className="flex-1 text-left">{label}</span>
      <kbd className="rounded border border-current/30 px-1.5 text-[11px] opacity-70">{shortcut}</kbd>
    </button>
  );
}
