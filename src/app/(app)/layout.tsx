import { QuickLogProvider } from "@/components/quick-log/quick-log";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { getAreas } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    areas,
  ] = await Promise.all([supabase.auth.getUser(), getAreas()]);

  return (
    <QuickLogProvider areas={areas}>
      <div className="flex min-h-dvh">
        <Sidebar email={user?.email} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">{children}</main>
        <BottomNav />
      </div>
    </QuickLogProvider>
  );
}
