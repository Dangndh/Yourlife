import { BookOpen } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "learning",
  icon: BookOpen,
  pages: [
    { slug: "goals", labelKey: "goals" },
    { slug: "courses", labelKey: "courses" },
    { slug: "sessions", labelKey: "sessions" },
    { slug: "skills", labelKey: "skills" },
  ],
};
