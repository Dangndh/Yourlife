import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { coreNav, reflectNav } from "@/core/navigation";
import { modules } from "@/modules";

import { NavLink } from "./nav-link";

/** Desktop sidebar (md and up). On phones the bottom nav takes over. */
export async function Sidebar({ email }: { email?: string }) {
  const t = await getTranslations();

  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r md:flex">
      <div className="px-5 py-5">
        <div className="text-lg font-semibold">{t("app.name")}</div>
        <div className="text-muted-foreground text-xs">{t("app.tagline")}</div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-0.5">
          {coreNav.map((item) => (
            <NavLink key={item.href} href={item.href} label={t(`nav.${item.labelKey}`)} icon={<item.icon className="size-4" />} />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-muted-foreground px-3 pb-1 text-xs font-medium uppercase tracking-wide">
            {t("nav.areas")}
          </div>
          {modules.map((m) => (
            <NavLink key={m.key} href={`/${m.key}`} label={t(`areas.${m.key}`)} icon={<m.icon className="size-4" />} />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          {reflectNav.map((item) => (
            <NavLink key={item.href} href={item.href} label={t(`nav.${item.labelKey}`)} icon={<item.icon className="size-4" />} />
          ))}
        </div>
      </nav>

      <form action="/auth/signout" method="post" className="border-sidebar-border border-t px-3 py-3">
        {email && <div className="text-muted-foreground truncate px-3 pb-2 text-xs">{email}</div>}
        <button
          type="submit"
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm"
        >
          <LogOut className="size-4" />
          {t("nav.signOut")}
        </button>
      </form>
    </aside>
  );
}
