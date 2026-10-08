import { Suspense } from "react";
import { GlossaryBrowser } from "@/components/domain/GlossaryBrowser";
import { Crumbs, DraftNotice } from "@/components/domain/parts";

export const metadata = { title: "Glossary · Know your domain" };

export default function GlossaryPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Crumbs items={[{ label: "Know your domain", href: "/know-your-domain" }, { label: "Glossary" }]} />
        <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Glossary</h1>
        <p className="text-[15px] text-brand-primary leading-relaxed max-w-3xl mb-6" style={{ opacity: 0.65 }}>
          Plain-language definitions of the terms you hear in healthcare and value-based care. Click a term
          for the longer explanation, related terms and sources.
        </p>
        <DraftNotice />
        {/* useSearchParams in the browser needs a Suspense boundary during prerender. */}
        <Suspense fallback={<div className="h-40" />}>
          <GlossaryBrowser />
        </Suspense>
      </div>
    </div>
  );
}
