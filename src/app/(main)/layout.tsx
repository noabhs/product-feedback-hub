import Link from "next/link";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { ApiKeyControl } from "@/components/ui/ApiKeyControl";
import { SyncNowControl } from "@/components/ui/SyncNowControl";
import { isOwner } from "@/lib/people";
import { PageViewTracker } from "@/components/PageViewTracker";
import { AppShell } from "@/components/AppShell";
import { PageComments } from "@/components/PageComments";
import { SidebarNav } from "@/components/SidebarNav";
import { SIDEBAR_COOKIE, modeFromCookie } from "@/lib/sidebar-state";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const defaultMode = modeFromCookie((await cookies()).get(SIDEBAR_COOKIE)?.value);
  return (
    <AppShell
      defaultMode={defaultMode}
      sidebar={
      <aside className="w-full h-full flex flex-col overflow-y-auto rail:pb-9 rail:[scrollbar-width:none]" style={{ background: "#250359" }}>
        <div className="px-5 py-6 rail:px-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Link href="/home" aria-label="navina Product Insights Hub, home" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 bg-brand-secondary-500">
              <span className="text-white font-extrabold text-xs">N</span>
            </div>
            <div className="rail:hidden">
              <p className="text-white font-semibold text-sm leading-none">navina</p>
              <p className="text-teal text-[10px] font-medium leading-none mt-0.5">Product Insights Hub</p>
            </div>
          </Link>
        </div>

        <SidebarNav />

        {session?.user?.email === "noa.bhs@navina.ai" && (
          <div className="px-3 pb-2 rail:px-1.5">
            <ApiKeyControl />
          </div>
        )}

        {isOwner(session?.user?.email) && (
          <div className="px-3 pb-2 rail:hidden">
            <SyncNowControl />
          </div>
        )}

        {/* The footer's Sign out and Sync now are not in the rail. An icon-only Sign
            out in the bottom corner looks like the expand button — a box with an
            arrow pointing right — and signs you out when clicked. Sync now goes for
            the same reason: of the rail's icons, only pages and the key dialog are
            safe to click by mistake. */}
        {session?.user && (
          <div className="px-3 py-4 rail:hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
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
      <PageComments currentUser={session?.user?.email ?? null} />
      {children}
    </AppShell>
  );
}
