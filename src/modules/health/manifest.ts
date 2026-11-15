import { HeartPulse } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "health",
  icon: HeartPulse,
  pages: [
    { slug: "workouts", labelKey: "workouts" },
    { slug: "records", labelKey: "records" },
    { slug: "habits", labelKey: "habits" },
  ],
};
