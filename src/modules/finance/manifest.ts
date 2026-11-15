import { Wallet } from "lucide-react";

import type { ModuleManifest } from "@/core/module-manifest";

export const manifest: ModuleManifest = {
  key: "finance",
  icon: Wallet,
  pages: [
    { slug: "transactions", labelKey: "transactions" },
    { slug: "accounts", labelKey: "accounts" },
    { slug: "budgets", labelKey: "budgets" },
    { slug: "goals", labelKey: "goals" },
    { slug: "exchange-rates", labelKey: "exchange-rates" },
  ],
};
