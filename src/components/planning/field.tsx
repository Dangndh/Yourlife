"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + translated error. `error` is a key in planning.errors. */
export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("planning.errors");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function FormError({ error }: { error?: string }) {
  const t = useTranslations("planning.errors");
  if (!error) return null;
  return <p className="text-destructive text-sm">{t(error)}</p>;
}
