import { getTranslations } from "next-intl/server";

import { NavLink } from "@/components/shell/nav-link";
import { PageHeader } from "@/components/page-header";
import { coreNav, reflectNav } from "@/core/navigation";
import { modules } from "@/modules";

// Phone-only menu behind the "More" tab: everything the desktop sidebar shows.
export default async function MorePage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("nav.more")} />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-0.5">
          <h2 className="text-muted-foreground px-3 pb-1 text-xs font-medium uppercase">{t("nav.areas")}</h2>
          {modules.map((m) => (
            <NavLink key={m.key} href={`/${m.key}`} label={t(`areas.${m.key}`)} icon={m.icon} />
          ))}
        </section>
        <section className="flex flex-col gap-0.5">
          {[...coreNav.slice(1), ...reflectNav].map((item) => (
            <NavLink key={item.href} href={item.href} label={t(`nav.${item.labelKey}`)} icon={item.icon} />
          ))}
        </section>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-muted-foreground px-3 py-2 text-sm">
            {t("nav.signOut")}
          </button>
        </form>
      </div>
    </>
  );
}
