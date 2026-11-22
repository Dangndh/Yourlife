import type { AreaOption } from "@/core/types";

type T = { (key: string): string; has: (key: string) => boolean };

/** Built-in areas use the translated name; custom areas keep their own name. `t` must be the root translator. */
export function areaName(t: T, area: Pick<AreaOption, "key" | "name"> | undefined) {
  if (!area) return "";
  return t.has(`areas.${area.key}`) ? t(`areas.${area.key}`) : area.name;
}
