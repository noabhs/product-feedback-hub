import { redirect } from "next/navigation";

/** The Asks log moved into Analytics; this keeps old links and bookmarks working. */
export default function FeedbackInsightsRedirect() {
  redirect("/analytics?tab=asks");
}
