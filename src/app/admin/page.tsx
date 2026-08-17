import { redirect } from "next/navigation";

/**
 * The Admin page was dissolved: the API key control moved to the sidebar, CSV
 * import to the Feedback and Discovery pages, and discovery documents to
 * /discovery/extract. Kept as a redirect so existing bookmarks still land
 * somewhere useful.
 */
export default function AdminRedirect() {
  redirect("/home");
}
