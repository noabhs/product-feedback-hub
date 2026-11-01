import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { ApiKeyControl } from "@/components/ui/ApiKeyControl";
import { SyncNowControl } from "@/components/ui/SyncNowControl";
import { isOwner } from "@/lib/people";
import { PageViewTracker } from "@/components/PageViewTracker";
import { AppShell } from "@/components/AppShell";
import { SidebarNav } from "@/components/SidebarNav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <AppShell
      sidebar={
      <aside className="w-full h-full flex flex-col overflow-y-auto" style={{ background: "#250359" }}>
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 bg-brand-secondary-500">
              <span className="text-white font-extrabold text-xs">N</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">navina</p>
              <p className="text-teal text-[10px] font-medium leading-none mt-0.5">Product Insights Hub</p>
            </div>
          </Link>
        </div>

        <SidebarNav />

        {session?.user?.email === "noa.bhs@navina.ai" && (
          <div className="px-3 pb-2">
            <ApiKeyControl />
          </div>
        )}

        {isOwner(session?.user?.email) && (
          <div className="px-3 pb-2">
            <SyncNowControl />
          </div>
        )}

        {session?.user && (
          <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="px-3 text-[11px] text-white/40 truncate" title={session.user.email ?? ""}>
              {session.user.email}
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/signin" });
              }}
            >
              <button
                type="submit"
                className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </aside>
      }
    >
      <PageViewTracker />
      {children}
    </AppShell>
  );
}
