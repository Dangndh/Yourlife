import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Two-step delete without browser dialogs: open, then confirm. */
export function DeleteButton({
  action,
  id,
  next,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  next?: string;
  label?: string;
}) {
  const t = useTranslations("planning");
  return (
    <details className="group">
      <summary className="text-muted-foreground hover:text-destructive inline-flex cursor-pointer list-none items-center gap-1.5 text-sm [&::-webkit-details-marker]:hidden">
        <Trash2 className="size-4" />
        {label ?? t("delete")}
      </summary>
      <form action={action} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        {next && <input type="hidden" name="next" value={next} />}
        <span className="text-sm">{t("deleteConfirm")}</span>
        <Button type="submit" variant="destructive" size="sm">
          {t("delete")}
        </Button>
      </form>
    </details>
  );
}
