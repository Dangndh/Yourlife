import { House } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "family",
  icon: House,
  pages: [
    { slug: "members", labelKey: "members" },
    { slug: "events", labelKey: "events" },
    { slug: "responsibilities", labelKey: "responsibilities" },
  ],
};
