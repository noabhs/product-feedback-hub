import Link from "next/link";
import { CopySkill } from "@/components/home/CopySkill";

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Connect Google Calendar and Slack in Claude",
    body: (
      <>
        In Claude, open your connector settings and connect <strong>Google Calendar</strong> and{" "}
        <strong>Slack</strong>. The skill reads only your own calendar and messages only you.
      </>
    ),
  },
  {
    title: "Connect the hub to your Claude",
    body: (
      <>
        Create a personal token on <Link href="/connect-claude" className="text-brand-secondary-600 underline">Connect Claude</Link> and
        follow the setup shown there. This is how Claude generates briefs from the hub.
      </>
    ),
  },
  {
    title: "Add the skill",
    body: (
      <>
        Copy the skill below, then tell Claude: <em>&ldquo;Save this as a skill&rdquo;</em> and paste it. Or download
        the file and upload it as a skill in Claude&apos;s settings.
      </>
    ),
  },
  {
    title: "Try it once",
    body: (
      <>
        Ask Claude: <em>&ldquo;Run client-brief-dm for my meetings in the next 7 days.&rdquo;</em> You should get one Slack
        DM per client you&apos;re meeting. Check the first brief reads right before you schedule it.
      </>
    ),
  },
  {
    title: "Schedule it daily",
    body: (
      <>
        Ask Claude: <em>&ldquo;Run client-brief-dm every weekday at 7am.&rdquo;</em> It then briefs you on
        tomorrow&apos;s external meetings automatically, and sends nothing on days without any.
      </>
    ),
  },
];

export default function DailyBriefsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-[26px] font-extrabold text-brand-primary mb-2">Daily client briefs in Slack</h1>
          <p className="text-[14px] text-brand-primary opacity-70 leading-relaxed">
            Every day, Claude checks your calendar for tomorrow&apos;s meetings with people outside Navina, generates the
            hub&apos;s client brief for each client, and DMs you one brief per client. Set it up once, about five minutes.
          </p>
        </div>

        <ol className="space-y-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-secondary-500/10 text-brand-secondary-600 text-[13px] font-bold shrink-0">
                {i + 1}
              </span>
              <div className="space-y-1.5">
                <h2 className="text-[15px] font-bold text-brand-primary">{s.title}</h2>
                <p className="text-[14px] text-brand-primary opacity-80 leading-relaxed">{s.body}</p>
                {i === 2 && <CopySkill />}
              </div>
            </li>
          ))}
        </ol>

        <p className="text-[12.5px] text-brand-primary opacity-60 leading-relaxed">
          Briefs go only to your own Slack DM; they can contain candid risk notes, so don&apos;t forward them outside
          Navina. Each brief uses the hub&apos;s Claude quota, so the skill briefs at most 10 clients per day.
        </p>
      </div>
    </div>
  );
}
