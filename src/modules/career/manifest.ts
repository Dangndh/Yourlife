import { Briefcase } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "career",
  icon: Briefcase,
  pages: [
    { slug: "jobs", labelKey: "jobs" },
    { slug: "projects", labelKey: "projects" },
    { slug: "achievements", labelKey: "achievements" },
    { slug: "skills", labelKey: "skills" },
  ],
};
