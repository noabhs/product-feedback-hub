import { StartChatBox } from "@/components/ask/StartChatBox";
import { QAvatar } from "@/components/home/QAvatar";

export default function AskPage() {
  return (
    <div className="h-full overflow-y-auto px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-2.5">
          <QAvatar />
          <h1 className="text-[18px] font-semibold leading-tight text-brand-primary">Ask Q</h1>
        </div>
        <p className="mb-5 text-[14px] leading-relaxed text-brand-primary/65">
          Ask about client feedback, competitors, feature requests or the client table — then keep going with follow-ups.
          Your chats are saved on the left, private to you and the hub owner.
        </p>
        <div className="rounded-lg border border-[rgba(50,43,95,0.08)] bg-white p-5">
          <StartChatBox autoFocus />
        </div>
      </div>
    </div>
  );
}
