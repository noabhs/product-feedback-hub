---
name: slack-feedback-to-hub-csv
description: Extract client feedback items from Slack channels and Jira's NIH Triage board and push them straight into the Navina Insights Hub (product-feedback-hub-topaz.vercel.app), skipping anything already processed on a previous run. Use this whenever the user wants to pull, fetch, sync, push, or catch up on feedback from Slack or Jira — including "fetch feedback from #channel", "any new feedback this week?", "push the feedback to the Hub", "run the weekly feedback sync", "sync #ambient-product-insights", a bare Slack channel URL alongside a request for feedback or insights, or a scheduled/automated weekly run. Also use for turning meeting-recap posts into structured insight rows, syncing new NIH Jira tickets, or when asked what has already been extracted.
---

# Feedback → Insights Hub sync

Navina's feedback arrives two ways: Slack channels that are a stream of
meeting recaps, and Jira tickets on the NIH Triage board. Both map onto the
same Hub row schema, get deduped, and get pushed in. This skill remembers
what it has already read from each source so a routine run — by hand or on
the Saturday schedule — costs almost nothing and never produces duplicates.

**Read `references/taxonomy.md` before writing any items** — it holds the
exact vocabularies and five ways the Hub's importer fails silently.
**Read `references/extraction-guide.md`** for how to decide what counts as
one Slack item; the equivalent judgment calls for Jira are inline below,
since a ticket is already one discrete thing.

## Two ways this runs

- **Ad hoc** — "sync #channel", "any new feedback this week?", "push to the
  Hub". Do exactly what's asked: one channel, or check-in on everything, and
  ask before anything ambiguous (a new client, an unplaceable persona, which
  channel a bare name resolves to).
- **Weekly automated run** (Saturdays, unattended, no human present to ask) —
  see [Unattended mode](#unattended-mode) below for what changes. Everything
  else — extraction, mapping, state, push — is identical.

## Paths

```
Slack state:  ~/Documents/navina-insights-hub/.feedback-state/slack.json
Jira state:   ~/Documents/navina-insights-hub/.feedback-state/jira.json
Output:       ~/Downloads/feedback-<source>-<YYYY-MM-DD>.csv
Master:       ~/Documents/navina-insights-hub/.feedback-state/all-items.csv
Skill:        ~/.claude/skills/slack-feedback-to-hub-csv
```

State lives next to the Hub rather than in the skill directory so it survives
skill reinstalls — losing it would mean re-extracting a year of history.

## Source 1 — Slack

### 1. Find the channels

For an ad hoc request naming a channel, resolve it as before: accept a name,
an ID, or a URL (`https://…/archives/C09A17PCK2P` → `C09A17PCK2P`), or use
`slack_search_channels` for a bare name. Confirm the resolved channel name
back to the user before a long run.

For the weekly run, discover every feedback channel instead of being told
one, three separate ways:

```
slack_list_user_channels(name_prefix="customer-", format="names_only", limit=200)
slack_list_user_channels(name_prefix="prospect",  format="names_only", limit=200)
slack_list_user_channels(name_prefix="client-",   format="names_only", limit=200)
```

This lists channels the connected identity is *actually a member of* rather
than doing a relevance search, which is what makes it reliable — a keyword
search over names/topics misses channels whose topic doesn't happen to
contain the search term. `name_prefix` scans internally, so don't worry about
pagination.

**Residual gap:** this only sees channels the identity has joined. Once in a
while (monthly is plenty — not every Saturday), also run
`slack_search_channels` with keywords `customer`, `prospect`, and `client` to
catch a channel matching the naming convention that nobody's joined yet, and
tell the user about it rather than silently skipping it — an unread channel
is exactly the failure mode the real `conversations.list` approach in the
spec was chosen to avoid.

### Visit EVERY discovered channel — state or not

The run's channel set is **whatever discovery returns**, never "the channels
already in `slack.json`". A channel with no state entry is a new channel, not
an out-of-scope one: read it with `oldest` = 60 days ago (a first-visit window;
use `date +%s` minus 5184000), extract, and commit it so the next run uses its
`high_water_ts`. Don't defer new channels to a separate "backfill" — a prior
run did exactly that and silently skipped ~75 channels. Also include the
non-`customer-` channels already tracked in `slack.json` (e.g. #prospects,
#competitive-intelligence, #articles, #customer-success).

Compare discovery against `slack.json` at the start of every run and say in
the recap how many channels were visited and how many were first-time.

For a first-time sweep of many channels, fan out: split channels into groups
of ~12 and give each to a read-only subagent that reads, extracts items JSON
and a `seen` ts list, but does **not** push or commit state. Merge, run
`build_csv.py`, push once, then commit state from the merged `seen` lists.

Before building, normalise what subagents return: theme keys
(`DATA_INTEGRATION`, `PRICING_WTP`, ...) must not appear in `productAreas`
(move to `theme`; empty area becomes `GENERAL`), and resolve blank clients
against `src/lib/accounts.ts` (unique match → use the name; ambiguous or no
match → leave blank and flag in the recap).

### 2–9. Everything else is the existing per-channel flow

For **each** discovered channel, run the same steps as before, unchanged:

1. Check `state.py show` for `high_water_ts`, pass it as `oldest`.
2. Fetch messages, run `state.py pending` to split new / thread_grew / skip.
   If nothing is pending, that's a normal outcome — move to the next
   channel, don't report a failure.
3. Read full content of pending posts (`slack_read_thread` for replies,
   follow cross-posts).
4. Extract items per `references/extraction-guide.md`.
5. Validate and build rows with `build_csv.py` (per-channel or batched — see
   [Building and pushing all sources together](#building-and-pushing-all-sources-together)).
6. Commit state with `state.py commit` — **only after** the push succeeded (`pushed: true`, no errors). A skipped or failed push does not count, even though the CSV was written
   (see that section).

All the per-post judgment calls (date is when the feedback happened not when
it was posted, praise counts, threads, cross-posts, persona mapping, client
names) are exactly as documented in `references/extraction-guide.md` and
`references/taxonomy.md`. Nothing about extraction changes for the automated
run — only *which channels* get visited, *whether you can ask* when unsure,
and *how the push happens*.

## Source 2 — Jira NIH sync

Project key `NIH` on `https://navina.atlassian.net`, via the Atlassian MCP
connector (tool prefix `mcp__<id>__...`; must be authorized in this session
— if it shows `needs_auth`, say so and stop rather than guessing at ticket
content).

### 1. Check the cursor

```bash
python3 ~/.claude/skills/slack-feedback-to-hub-csv/scripts/jira_state.py show \
  --state ~/Documents/navina-insights-hub/.feedback-state/jira.json
```

Use `cursor_date` as the lower bound of the JQL search.

### 2. Search and fetch

```
searchJiraIssuesUsingJql(
  cloudId: "navina.atlassian.net",   # the hostname works directly, no need for getAccessibleAtlassianResources first
  jql: 'project = NIH AND created >= "<cursor_date>" ORDER BY created ASC',
  fields: ["summary", "description", "status", "priority", "created",
           "reporter", "creator", "customfield_10136", "customfield_10360"],
  responseContentFormat: "markdown",   # gets a clean description, not raw ADF —
                                        # this is what avoids the "unreadable
                                        # ADF-table block" problem the original
                                        # spec worried about; no manual rewrite needed
  maxResults: 100,
)
```

Page with `nextPageToken` from `pageInfo.endCursor` while `pageInfo.hasNextPage`
is true. Two field quirks to handle when mapping (seen firsthand pulling
live NIH tickets):

- **`customfield_10136` ("Customer") is an array** of `{value, id}` objects,
  not a plain string — even though it's usually one entry. Join multiple
  `.value`s with `; ` if more than one is genuinely set.
- **Values can carry stray zero-width/invisible characters** (a real ticket
  had `"​MediSys Health Network "` — a leading zero-width space plus
  trailing whitespace). Strip more than `.strip()` alone catches, or the
  client will fail to match `~/Documents/navina-insights-hub/src/lib/accounts.ts`
  and silently end up blank when it shouldn't.

### 3. Work out what's new

```bash
python3 …/scripts/jira_state.py pending \
  --state <STATE> --tickets /tmp/fetched.json
```

`fetched.json` is `[{"key": "NIH-451", "created": "2026-09-10T14:22:00.000+0000"}, …]`.
Dedupe by **ticket key**, not date — the JQL date filter is inclusive by day,
so a ticket from the cursor date itself reappears in the next query and must
be recognized as already-synced rather than re-imported.

### 4. Map each new ticket to a Hub row

- **`productArea`** — from the Category custom field: `Dx -*` / `Data -
  HIE/Portrait/Clinical resources` → `RISK_DX`; `Qual -*` → `QUALITY`;
  `Analytics -*` → `ANALYTICS`; `Core -*` / internal tooling → `GENERAL`;
  ambient/scribe content → `AMBIENT`; otherwise the closest fit from
  `references/taxonomy.md`'s area list. One or two areas joined with `;`
  (three means split into two tickets' worth of rows).
- **`theme`** — one of the eight canonical keys in `references/taxonomy.md`.
  Default `DATA_INTEGRATION` for engine/measure-logic requests, `PAIN_POINTS`
  for UX friction, `TRUST` for security/compliance/PHI, `WORKFLOW` for
  process/ordering requests.
- **`persona`** — blank unless a role is clearly named in the ticket.
- **`oneLiner`** — the Summary field, verbatim.
- **`content`** — the Description field as returned with
  `responseContentFormat: "markdown"` (already clean Markdown, links and
  all — no ADF or wiki-markup cleanup needed), plus a footer line:
  `Jira status: <status> · Priority: <priority>`.
- **`date`** — the ticket's `created` date, `YYYY-MM-DD`.
- **`wtp`** — blank.
- **`source`** — `Jira: NIH-<number>`.
- **`client`** — the Customer field, unless it's blank or a generic value
  like "Multiple Customers" — leave blank rather than guess.
- **`sourceUrl`** — `https://navina.atlassian.net/browse/NIH-<number>`.
- **`reporter`** — the ticket's **Reporter** display name, never Creator —
  some tickets are filed via a "Zendesk Support for Jira" bot integration as
  creator, and crediting the bot instead of the person misattributes every
  one of those.
- **`speaker`** — leave unset when building the items JSON for
  `build_csv.py`; there's no separate speaker for a ticket, and setting one
  would prepend a redundant name to content that's already the ticket
  description.

### 5. Commit

```bash
python3 …/scripts/jira_state.py commit \
  --state <STATE> --commits /tmp/commits.json
```

`commits.json` is `[{"key": "NIH-451", "created": "2026-09-10T…", "items": 1}]`
— one entry per ticket processed, including tickets that yielded zero items
(a ticket that's pure internal noise still needs to be marked seen, or it
reappears every week). Same ordering rule as Slack: commit only after the
push/CSV has actually landed.

## Competitive intelligence goes to Competitors, not feedback

Competitive intelligence — market/regulatory news, a rival's product, pricing,
funding or strategy (e.g. `#competitive-intelligence`, `#articles`, battlecards)
— is **not** client feedback and must not be pushed through `push_rows.py`. The
Hub rejects any feedback row whose client is "Competitive Intelligence".

Route it to competitor claims instead:

- Build `{"claims": [{"competitor", "oneLiner", "content", "topics", "productAreas",
  "confidence", "sensitivity", "sensitivityReason", "asOf", "sourceUrl",
  "sourceLabel"}]}` where `sourceUrl` is the Slack permalink of the post the claim
  came from (or the article it cites) and `sourceLabel` is e.g. "Slack
  #competitive-intelligence" — always set them, they are what the Source column on
  /competitors links to. `competitor`
  is the company's name (a new one is created automatically). For regulators,
  publications and market-wide notes use `Market & regulatory` and keep the real
  subject at the front of `oneLiner` ("CMS: …").
- `topics` from PRICING, PACKAGING, CAPABILITIES, INTEGRATIONS, POSITIONING,
  CUSTOMERS, FUNDING, ORG_AND_PEOPLE, DELIVERY, WEAKNESSES, STRATEGY, VS_NAVINA;
  `confidence` VERIFIED / REPORTED / CLAIMED; `sensitivity` defaults to
  `internal` — only say `external` for plainly public facts.
- Push with `scripts/push_claims.py --claims-json <file>` (same
  `FEEDBACK_IMPORT_SECRET`, posts to `/api/cron/competitor-claims-import`).
  Repeat pushes skip claims the competitor already has.

A client quoting or comparing a rival is still **client feedback** — keep it as
a feedback row with the client set (area `COMPETITIVE` is fine there).

## Building and pushing all sources together

Build one combined items list across every Slack channel and every new Jira
ticket for the run, so `build_csv.py`'s duplicate-`(client, oneLiner)` check
sees the whole batch at once — a Slack post and a Jira ticket about the same
complaint from the same client would otherwise collide invisibly instead of
erroring where you can fix it.

```bash
python3 ~/.claude/skills/slack-feedback-to-hub-csv/scripts/build_csv.py \
  --items /tmp/items.json \
  --out ~/Downloads/feedback-<date>.csv \
  --rows-json /tmp/rows.json \
  --source-label "Weekly sync" \
  --append-to ~/Documents/navina-insights-hub/.feedback-state/all-items.csv
```

(`--source-label` is only the fallback when an item doesn't set its own
`source` — Jira items should set `source` themselves per the mapping above,
so this only really applies to Slack items missing one.)

### Push — direct API first, browser second, CSV always

```bash
python3 ~/.claude/skills/slack-feedback-to-hub-csv/scripts/push_rows.py \
  --rows-json /tmp/rows.json
```

This POSTs to `/api/cron/feedback-import` — a bearer-secret-gated route
(reads `FEEDBACK_IMPORT_SECRET` from the environment) that bypasses the
Hub's Google-SSO gate the same way `/api/cron/weekly-recap` already does, so
no signed-in browser session is needed. It exits nonzero and makes no
request if the secret isn't set — treat that as "push skipped," not a hard
failure: the CSV/rows are still written, so nothing is lost, and the recap
message (below) should say the push was skipped.

If the secret **is** set but the request fails (route not deployed yet,
network error, etc.), that's worth surfacing distinctly from "skipped" —
say what actually happened.

For an **ad hoc** run with a human present and no secret configured, the old
browser-cookie push is still available as a fallback — see git history of
this file, or drive `https://product-feedback-hub-topaz.vercel.app/insights`
directly and `fetch('/api/import', ...)` from the signed-in page. Don't use
it for the unattended weekly run; there's nobody there to sign in if the
session has expired.

Report `imported`, `created` (the real change in row count — `imported`
counts upserts, some of which are no-ops), and any `errors`.

**Never rewrite `client` to the Hub's canonical account name** — see
`references/taxonomy.md`; the id is a hash of the short name you write, and
rewriting it later duplicates the whole back catalogue.

## Unattended mode

Everything above the fold changes are the same. What's different when this
runs on the Saturday schedule with nobody to ask:

- **Never pause on an ambiguous new client.** The interactive flow asks
  before the first push of a channel whose client isn't in the Hub yet,
  because a wrong guess can't be undone. Unattended, there's no one to
  answer, and `/api/accounts` needs a signed-in session — so check locally
  instead, against `~/Documents/navina-insights-hub/src/lib/accounts.ts`
  (`SEED_ACCOUNTS`, with its `aliases`). If a channel or ticket's client
  reference is genuinely ambiguous between two or more entries there, or
  matches none, **leave `client` blank** rather than guess, and list every
  such item in the recap message so a human resolves it by hand later. Blank
  is recoverable (edit later); a wrong short name that happens to resolve
  somewhere is not — the raw string you write is permanent, since it's half
  of the row's id hash.
- **Same for an unplaceable persona** — leave it blank rather than default to
  `Provider`, and mention it in the recap.
- **Still don't skip committing zero-item posts/tickets.** The whole point of
  state is that an unattended run never re-reads history; committing "seen,
  nothing extracted" is what makes that true.
- **If Atlassian shows `needs_auth`,** skip the Jira half for that run, still
  do the Slack half, and say plainly in the recap that Jira was skipped and
  why — don't silently drop a whole source.
- **If the push is skipped** (no `FEEDBACK_IMPORT_SECRET`) or fails, the
  CSV/rows-json are still on disk — say so in the recap so the count of
  "new items found" doesn't get confused with "items actually in the Hub."

### Report to Slack

After each run — ad hoc or scheduled — post a short summary to
`#product-feedback-recap` (channel ID `C0BUJCU3188`) via `slack_send_message`:
new items found per source, push/import counts (`created`, not just
`imported`), anything skipped (Jira unauthorized, push skipped, an
unresolved client/persona), and any pattern worth a human's attention. Keep
it to a few lines — this is a heads-up, not the full report.

## Backfilling history already extracted by hand

Slack: `state.py seed` as before. Jira: `jira_state.py seed --state <STATE>
--key-list /tmp/done.json` where `done.json` is `["NIH-100", …]` or
`[{"key": "NIH-100", "created": "2026-…"}]`.

## Notes and limits

- **Edited Slack posts are not revisited** — state is keyed on ts. Delete the
  ts from `slack.json` to force a re-read.
- **Edited Jira tickets are not revisited either** — state is keyed on ticket
  key, once synced always synced. Delete the key from `jira.json` to force a
  re-read if a ticket was substantially rewritten.
- **The importer won't update existing rows** — upsert with `update: {}`.
  Fix a wrong row by deleting it in the Hub first, then re-importing. This is
  also what makes a repeat push safe: it cannot create duplicates.
- **Read-only on Slack and Jira.** This skill never posts, reacts, comments,
  or transitions a ticket. The Slack recap post is the one exception, and
  it's a fixed, low-noise summary — not a place to editorialize.
- **Slack MCP is required** for the Slack half; **Atlassian MCP is required**
  for the Jira half. If either shows `needs_auth`, say so for that half
  specifically rather than falling back to scraping — a scrape misses thread
  replies, cross-post bodies, and ticket fields, which is how feedback goes
  missing unnoticed.
