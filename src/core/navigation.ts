import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  LayoutDashboard,
  LineChart,
  NotebookPen,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; labelKey: string; icon: LucideIcon };

/** Shared layer (core) — the same for every life area. Labels are keys in messages → "nav". */
export const coreNav: NavItem[] = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/goals", labelKey: "goals", icon: Target },
  { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
  { href: "/log", labelKey: "log", icon: Activity },
  { href: "/metrics", labelKey: "metrics", icon: LineChart },
];

export const reflectNav: NavItem[] = [
  { href: "/journal", labelKey: "journal", icon: NotebookPen },
  { href: "/reviews", labelKey: "reviews", icon: ClipboardCheck },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/settings", labelKey: "settings", icon: Settings },
];
