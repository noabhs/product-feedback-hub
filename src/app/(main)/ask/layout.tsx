export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AskShell } from "@/components/ask/AskShell";
import { listConversations } from "@/lib/ask-conversation";

/** The chat history lives here so it stays put while you move between chats. */
export default async function AskLayout({ children }: { children: React.ReactNode }) {
  const email = (await auth())?.user?.email;
  if (!email) redirect("/signin");
  const conversations = await listConversations(email);
  return <AskShell conversations={conversations}>{children}</AskShell>;
}
