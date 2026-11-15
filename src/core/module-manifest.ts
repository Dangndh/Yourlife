import type { LucideIcon } from "lucide-react";

/**
 * Every life-area module registers itself with a manifest.
 * Adding a module = new folder in src/modules + migration + one line in src/modules/index.ts.
 */
export type ModuleManifest = {
  /** Matches life_areas.key in the database and the URL segment (/finance). */
  key: string;
  icon: LucideIcon;
  /** Sub pages under /<key>/..., labels are i18n keys in messages/*.json → "pages". */
  pages: { slug: string; labelKey: string }[];
};
