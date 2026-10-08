import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { TOPICS, getTopic } from "@/lib/domain/topics";
import { GLOSSARY, termId } from "@/lib/domain/glossary";
import { Crumbs, DraftNotice, PROSE, ResourceList, SectionLabel } from "@/components/domain/parts";

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const terms = GLOSSARY.filter((g) => g.topics.includes(topic.slug));
  const related = topic.related.map((s) => getTopic(s)).filter((t): t is NonNullable<typeof t> => !!t);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Crumbs items={[{ label: "Know your domain", href: "/know-your-domain" }, { label: topic.title }]} />
        <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">{topic.title}</h1>
        <p className="text-[15px] text-brand-primary leading-relaxed max-w-3xl mb-6" style={{ opacity: 0.75 }}>
          {topic.summary}
        </p>

        <DraftNotice />

        {topic.status === "planned" ? (
          <div className="rounded-lg border border-dashed border-[rgba(50,43,95,0.18)] bg-white/60 p-6 text-[14px] text-brand-primary/70">
            The deep dive for this topic has not been written yet. The overview above says what it will cover.
          </div>
        ) : (
          <>
            <section className="mb-10">
              <SectionLabel>Key concepts</SectionLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {topic.concepts.map((c) => (
                  <div key={c.title} className="rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-4">
                    <h3 className="text-[14px] font-semibold text-brand-primary mb-1">{c.title}</h3>
                    <p className="text-[13.5px] text-brand-primary/75 leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10">
              <SectionLabel>Deep dive</SectionLabel>
              <div className="space-y-3">
                {topic.deepDive.map((s, i) => (
                  <details
                    key={s.heading}
                    open={i === 0}
                    className="group rounded-lg bg-white border border-[rgba(50,43,95,0.08)] open:shadow-sm"
                  >
                    <summary className="cursor-pointer select-none list-none px-5 py-3.5 text-[15px] font-semibold text-brand-primary flex items-center justify-between">
                      {s.heading}
                      <span className="text-brand-primary/40 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className={`px-5 pb-5 ${PROSE}`}>
                      <ReactMarkdown>{s.body}</ReactMarkdown>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}

        {terms.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Terms in this topic</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {terms.map((g) => (
                <Link
                  key={g.term}
                  href={`/know-your-domain/glossary?topic=${topic.slug}#${termId(g.term)}`}
                  className="px-3 py-1 rounded-pill bg-white border border-[rgba(50,43,95,0.12)] text-[12.5px] text-brand-primary hover:border-brand-secondary-500 hover:text-brand-secondary-500 transition-colors"
                >
                  {g.term}
                </Link>
              ))}
            </div>
          </section>
        )}

        {topic.resources.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Go further</SectionLabel>
            <ResourceList resources={topic.resources} />
          </section>
        )}

        {related.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Related topics</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {related.map((t) => (
                <Link
                  key={t.slug}
                  href={`/know-your-domain/${t.slug}`}
                  className="px-3 py-1.5 rounded-sm bg-lavender text-[13px] font-medium text-brand-primary hover:bg-brand-secondary-500 hover:text-white transition-colors"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
