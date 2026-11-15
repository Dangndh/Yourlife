import type { ModuleManifest } from "@/core/module-manifest";

import { manifest as career } from "./career/manifest";
import { manifest as family } from "./family/manifest";
import { manifest as finance } from "./finance/manifest";
import { manifest as growth } from "./growth/manifest";
import { manifest as health } from "./health/manifest";
import { manifest as learning } from "./learning/manifest";
import { manifest as relationships } from "./relationships/manifest";

/** Display order follows life_areas.sort_order seeded on sign-up. */
export const modules: ModuleManifest[] = [finance, career, learning, health, relationships, family, growth];

export function getModule(key: string): ModuleManifest | undefined {
  return modules.find((m) => m.key === key);
}
