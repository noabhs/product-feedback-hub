import { redirect } from "next/navigation";

/**
 * Question extraction moved onto the AI extract page as a mode, so both
 * extractors live in one place. Kept as a redirect because the Sources library
 * used to deep-link here with ?url= and ?name=.
 */
export default async function DiscoveryExtractRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams({ mode: "questions" });
  for (const key of ["url", "name"] as const) {
    const v = params[key];
    if (typeof v === "string" && v) q.set(key, v);
  }
  redirect(`/upload?${q.toString()}`);
}
