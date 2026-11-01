import { StartChatBox } from "@/components/ask/StartChatBox";
import { QAvatar } from "@/components/home/QAvatar";

/**
 * The empty state is the first thing most people see here, so it gets the one
 * flourish in the app: Q floats under a breathing halo, two sparks blink out of
 * step with each other, and the page rises into place a beat at a time. All of
 * it is CSS, and the global prefers-reduced-motion rule stills every bit of it.
 */
export default function AskPage() {
  return (
    <div className="h-full overflow-y-auto px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-3 animate-rise">
          <span className="relative inline-flex items-center justify-center">
            {/* Behind Q, not around him: a ring that grows and fades. */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-brand-secondary-500/30 animate-halo"
            />
            <span className="relative animate-bob">
              <QAvatar size={34} />
            </span>
            <span
              aria-hidden
              className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-teal animate-twinkle"
            />
            <span
              aria-hidden
              className="absolute -bottom-0.5 -left-1.5 h-1 w-1 rounded-full bg-brand-secondary-500 animate-twinkle [animation-delay:1.1s]"
            />
          </span>
          <h1 className="text-[20px] font-semibold leading-tight text-brand-primary">Ask Q</h1>
        </div>
        <p className="mb-5 text-[14px] leading-relaxed text-brand-primary/65 animate-rise [animation-delay:90ms]">
          Ask about client feedback, competitors, feature requests or the client table — then keep going with follow-ups.
          Your chats are saved on the left, private to you and the hub owner.
        </p>
        <div className="rounded-lg border border-[rgba(50,43,95,0.08)] bg-white p-5 shadow-sm animate-rise [animation-delay:180ms]">
          <StartChatBox autoFocus stagger />
        </div>
      </div>
    </div>
  );
}
