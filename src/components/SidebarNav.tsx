"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, Upload, BarChart3, Building2, Database, Lightbulb, Swords, GraduationCap, Boxes, Workflow, ChevronDown, MessageSquare } from "lucide-react";

/**
 * Three named sections, not one list of thirteen links.
 *
 * The sections answer different questions: Insights is what the outside world
 * is telling us, Learn is the background you need to read it, and The hub is
 * the tool itself — how it's doing, what's in it, and what you've asked for.
 * Each section collapses; only Insights starts open, and the section holding
 * the current page is always opened so you never land on a hidden link.
 *
 * In the folded-down rail (the `rail:` variant) every page is an icon, whether or
 * not its section is open — a rail that dropped Learn and The hub would leave no
 * way to reach them but unfolding — and each heading becomes a divider.
 */
const NAV_GROUPS: { label: string | null; defaultOpen?: boolean; items: { href: string; label: string; icon: typeof Home }[] }[] = [
  {
    label: null,
    items: [
      { href: "/home", label: "Home", icon: Home },
      { href: "/ask", label: "Ask Q", icon: MessageSquare },
    ],
  },
  {
    label: "Insights",
    defaultOpen: true,
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

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NAV_GROUPS.filter((g) => g.label).map((g) => [
        g.label!,
        !!g.defaultOpen || g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/")),
      ]),
    ),
  );

  return (
    <nav className="flex-1 px-3 py-4 rail:px-1.5">
      {NAV_GROUPS.map((group, i) => {
        const isOpen = group.label ? open[group.label] : true;
        return (
          <div
            key={group.label ?? group.items[0].href}
            className={i > 0 ? "mt-4 rail:mt-2 rail:border-t rail:border-white/10 rail:pt-2" : ""}
          >
            {group.label && (
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [group.label!]: !o[group.label!] }))}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-3 py-1.5 mb-1 rail:hidden rounded-sm text-[11.5px] font-bold uppercase tracking-[0.08em] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {group.label}
                <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`} />
              </button>
            )}
            {/* Always rendered: a closed section is `hidden`, except in the rail. */}
            <div className={`space-y-0.5 ${isOpen ? "" : "hidden rail:block"}`}>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rail:justify-center rail:px-0 rounded-sm text-[13.5px] font-medium whitespace-nowrap transition-all duration-150 ${
                      active ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="rail:sr-only">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
