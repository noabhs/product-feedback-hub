import Link from "next/link";
import { Home, Search, BookOpen, Upload, BarChart3, Building2, Database, LogOut, Lightbulb, Swords, GraduationCap, Boxes, Workflow } from "lucide-react";
import { auth, signOut } from "@/auth";
import { ApiKeyControl } from "@/components/ui/ApiKeyControl";
import { PageViewTracker } from "@/components/PageViewTracker";
import { AppShell } from "@/components/AppShell";

/**
 * Three named sections, not one list of thirteen links.
 *
 * The sections answer different questions: Insights is what the outside world
 * is telling us, Learn is the background you need to read it, and The hub is
 * the tool itself — how it's doing, what's in it, and what you've asked for.
 * Headings rather than dividers now: at this length a reader needs to be told
 * what a group is, not just that it ended.
 */
const NAV_GROUPS: { label: string | null; items: { href: string; label: string; icon: typeof Home }[] }[] = [
  { label: null, items: [{ href: "/home", label: "Home", icon: Home }] },
  {
    label: "Insights",
    items: [
      { href: "/insights", label: "Feedback", icon: Search },
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/competitors", label: "Competitors", icon: Swords },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/know-your-domain", label: "Know your domain", icon: GraduationCap },
      { href: "/know-your-product", label: "Know your product", icon: Boxes },
      { href: "/product-lifecycle", label: "Product lifecycle", icon: Workflow },
      { href: "/discovery", label: "Discovery prep", icon: BookOpen },
    ],
  },
  {
    label: "The hub",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/hub-data", label: "Hub data", icon: Database },
      { href: "/upload", label: "AI extract", icon: Upload },
      { href: "/feature-requests", label: "Your asks", icon: Lightbulb },
    ],
  },
];

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

        <nav className="flex-1 px-3 py-4">
          {NAV_GROUPS.map((group, i) => (
            <div key={group.label ?? group.items[0].href} className={i > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/35">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 rounded-sm text-[13.5px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {session?.user?.email === "noa.bhs@navina.ai" && (
          <div className="px-3 pb-2">
            <ApiKeyControl />
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
