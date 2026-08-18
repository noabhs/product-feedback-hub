import Link from "next/link";
import { Home, Search, BookOpen, Upload, BarChart3, Building2, LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { ApiKeyControl } from "@/components/ui/ApiKeyControl";
import { PageViewTracker } from "@/components/PageViewTracker";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/insights", label: "Feedback", icon: Search },
  { href: "/discovery", label: "Discovery", icon: BookOpen },
  { href: "/upload", label: "AI extract", icon: Upload },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex h-screen bg-surface-app overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: "#250359" }}>
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

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <ApiKeyControl />
        </div>

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

      <PageViewTracker />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
