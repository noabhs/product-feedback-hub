export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatThread } from "@/components/ask/ChatThread";
import { getConversationFor } from "@/lib/ask-conversation";
import { isOwner } from "@/lib/people";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = (await auth())?.user?.email;
  if (!email) redirect("/signin");

  // Someone else's chat and a chat that doesn't exist look the same.
  const conversation = await getConversationFor(email, id);
  if (!conversation) notFound();

  return <ChatThread key={conversation.id} conversation={conversation} canSendToSlack={isOwner(email)} />;
}
