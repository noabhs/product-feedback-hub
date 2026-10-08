"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Copy, Check, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TokenRow {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="bg-brand-primary/5 rounded-lg p-3 pr-12 text-[12px] text-brand-primary whitespace-pre-wrap break-all">{text}</pre>
      <button
        type="button"
        aria-label="Copy"
        className="absolute top-2 right-2 p-1.5 rounded hover:bg-brand-primary/10"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ConnectClaudePage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");

  const [reload, setReload] = useState(0);
  const load = () => setReload((n) => n + 1);
  useEffect(() => {
    fetch("/api/tokens")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setTokens(data.tokens));
  }, [reload]);

  const create = async () => {
    setError(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (!res.ok) return setError("Couldn't create a token. Try again.");
    setFresh((await res.json()).token);
    setLabel("");
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this token? Any Claude using it will stop working.")) return;
    await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    load();
  };

  const url = `${origin}/api/mcp`;
  const token = fresh ?? "<your-token>";

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-[26px] font-extrabold text-brand-primary mb-2">Use the hub&apos;s data in your own Claude</h1>
          <p className="text-[14px] text-brand-primary opacity-70 leading-relaxed">
            Connect your Claude to the hub and it can read feedback, clients, competitor claims, feature requests and
            discovery questions directly, then answer with its own reasoning. It&apos;s read-only: Claude can&apos;t
            change anything. Each token is yours — your reads are logged under your email.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-[15px] font-bold text-brand-primary">1. Create a token</h2>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label, e.g. My laptop"
              maxLength={60}
              className="flex-1 border border-brand-secondary-500/30 rounded-lg px-3 py-2 text-[14px]"
            />
            <Button onClick={create}><KeyRound className="w-4 h-4 mr-1.5" />Create token</Button>
          </div>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          {fresh && (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-brand-primary">
                Copy it now — it won&apos;t be shown again.
              </p>
              <CopyBlock text={fresh} />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-[15px] font-bold text-brand-primary">2. Add it to Claude</h2>
          <p className="text-[13px] text-brand-primary opacity-70"><b>Claude Code</b> — run in a terminal. <code>--scope user</code> makes the hub available in
            every project on your machine (leave it off and it only works in the folder you ran this in):
          </p>
          <CopyBlock text={`claude mcp add --scope user --transport http navina-hub ${url} --header "Authorization: Bearer ${token}"`} />
          <p className="text-[13px] text-brand-primary opacity-70 leading-relaxed">
            To add the hub to one shared project instead, use <code>--scope project</code>. That writes a <code>.mcp.json</code>{" "}
            into the repo, so never put your token in it: set <code>NAVINA_HUB_TOKEN</code> in your own shell and use{" "}
            <code>{"--header 'Authorization: Bearer ${NAVINA_HUB_TOKEN}'"}</code> (single quotes, so your shell doesn&apos;t expand it
            into the file). Each teammate uses their own token.
          </p>
          <p className="text-[13px] text-brand-primary opacity-70">
            <b>Claude Desktop</b> — Settings → Developer → Edit Config, add this under <code>mcpServers</code>, then restart
            (needs Node.js installed). It applies to all your chats; Desktop has no per-project setting:
          </p>
          <CopyBlock
            text={JSON.stringify(
              {
                "navina-hub": {
                  command: "npx",
                  args: ["-y", "mcp-remote", url, "--header", `Authorization: Bearer ${token}`],
                },
              },
              null,
              2,
            )}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-brand-primary">3. Ask away</h2>
          <p className="text-[13px] text-brand-primary opacity-70 leading-relaxed">
            The hub becomes a set of tools next to whatever else your Claude has (your files, GitHub, Jira…). Claude
            decides when to use them, based on your question; nothing is read in the background. Say &ldquo;check the
            hub&rdquo; to make sure it does, or &ldquo;don&apos;t use the hub&rdquo; to stop it. Claude Code asks before
            the first call.
          </p>
          <p className="text-[13px] text-brand-primary opacity-70 leading-relaxed">
            Try: &ldquo;What are Aegis&apos;s biggest complaints about Risk?&rdquo;, &ldquo;List competitor claims about
            ambient scribe pricing&rdquo;, or &ldquo;Which red-health accounts renew in the next 90 days, and what have they
            told us?&rdquo; 
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[15px] font-bold text-brand-primary">Your tokens</h2>
          <p className="text-[13px] text-brand-primary opacity-60">
            Treat a token like a password: it lives in your Claude config. If it leaks or you lose a laptop, revoke it here.
            This works with Claude Code and Claude Desktop, not with claude.ai on the web.
          </p>
          {tokens.length === 0 ? (
            <p className="text-[13px] text-brand-primary opacity-60">None yet.</p>
          ) : (
            <ul className="divide-y divide-brand-secondary-500/15 border border-brand-secondary-500/25 rounded-lg bg-white">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-[14px] font-semibold text-brand-primary">{t.label}</div>
                    <div className="text-[12px] text-brand-primary opacity-60">
                      {t.prefix}… · created {fmt(t.createdAt)} · {t.lastUsedAt ? `last used ${fmt(t.lastUsedAt)}` : "never used"}
                    </div>
                  </div>
                  <button type="button" aria-label="Revoke" onClick={() => revoke(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
