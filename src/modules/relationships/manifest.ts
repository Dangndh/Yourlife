import { Users } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "relationships",
  icon: Users,
  pages: [
    { slug: "contacts", labelKey: "contacts" },
    { slug: "interactions", labelKey: "interactions" },
  ],
};
