import { Sprout } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "growth",
  icon: Sprout,
  pages: [
    { slug: "goals", labelKey: "goals" },
    { slug: "experiences", labelKey: "experiences" },
    { slug: "reflections", labelKey: "reflections" },
  ],
};
