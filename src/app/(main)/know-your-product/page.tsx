import Link from "next/link";
import { HardHat, ArrowRight, GraduationCap, Search } from "lucide-react";

export const metadata = { title: "Know your product · Navina Product Insights Hub" };

/**
 * A placeholder with a date-free promise: it says the section is being built
 * and sends you somewhere useful meanwhile, rather than dead-ending.
 *
 * The animation is CSS only — keyframes live in globals.css, and the global
 * reduced-motion rule stills all of it for anyone who asks for that.
 */
export default function KnowYourProductPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Know your product</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            What Navina actually does, feature by feature — so feedback can be read against the product
            it is about.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white border border-[rgba(50,43,95,0.08)] px-6 py-16 text-center">
          {/* Blueprint paper under the scene. Fixed to the card, so it reads as
              a surface rather than another thing that moves. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(50,43,95,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(50,43,95,0.045) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
            }}
          />

          <div className="relative">
            <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 animate-bob">
              <HardHat className="w-9 h-9 text-amber-700 animate-sway" />
            </span>

            <h2 className="text-[22px] font-extrabold text-brand-primary mt-6">Under construction</h2>
            <p className="text-[14px] text-brand-primary/60 mt-2 max-w-md mx-auto leading-relaxed">
              This section is being built. It will cover Navina&apos;s features, what each one is for,
              and how clients actually use them.
            </p>

            {/* A bar that never fills, because nothing here is measured yet. */}
            <div className="relative mx-auto mt-7 h-1.5 w-56 overflow-hidden rounded-pill bg-[rgba(50,43,95,0.08)]">
              <div className="absolute inset-y-0 w-1/3 rounded-pill bg-brand-secondary-500/70 animate-sweep" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <Link
                href="/know-your-domain"
                className="group inline-flex items-center gap-2 rounded-pill border border-[rgba(50,43,95,0.12)] bg-white px-3.5 py-2 text-[13px] font-medium text-brand-primary/75 hover:border-brand-secondary-500 hover:text-brand-secondary-600 transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                Know your domain
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/insights"
                className="group inline-flex items-center gap-2 rounded-pill border border-[rgba(50,43,95,0.12)] bg-white px-3.5 py-2 text-[13px] font-medium text-brand-primary/75 hover:border-brand-secondary-500 hover:text-brand-secondary-600 transition-colors"
              >
                <Search className="w-4 h-4" />
                Product feedback
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
