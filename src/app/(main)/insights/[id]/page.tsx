import { redirect } from "next/navigation";

/**
 * Feedback detail is a side panel on the feed now, not a page of its own. This
 * route stays as a redirect so the links that point at it — the home page's
 * recent list, the AI answer citations, and anyone's bookmarks — still land on
 * the right entry.
 */
export default async function InsightDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/insights?open=${encodeURIComponent(id)}`);
}
