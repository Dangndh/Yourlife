"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckSquare, LayoutDashboard, Menu, NotebookPen, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { isActive } from "./nav-link";

const items = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
  { href: "/log", labelKey: "log", icon: Plus, primary: true },
  { href: "/journal", labelKey: "journal", icon: NotebookPen },
  { href: "/more", labelKey: "more", icon: Menu },
];

/** Phone navigation: Home, Tasks, Log (+), Journal, More. */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, labelKey, icon: Icon, primary }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={t(labelKey)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center",
                    primary && "bg-primary text-primary-foreground size-9 rounded-full",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {!primary && t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
