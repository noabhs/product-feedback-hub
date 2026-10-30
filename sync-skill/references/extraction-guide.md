# What counts as a feedback item

The hard part of this job isn't the CSV, it's deciding where one item ends and the
next begins. Get the granularity wrong and the Hub becomes either unsearchable
(one giant item per post) or unreadable (twelve fragments of one thought).

## The unit is one distinct piece of feedback

Navina's channel posts are meeting recaps: a single post routinely carries eight
separate observations under headings like "Areas for Improvement". Each bullet
that stands on its own becomes its own item.

The test: **could a PM act on this independently of the bullets around it?** If
yes, it's an item.

A recap of a feedback session with a rheumatologist might legitimately yield six
items — note structure, missing differentials, knowledge bases, regenerate-note,
documents tab praise, specialty ICD noise. Those go to different owners. One row
would bury five of them.

Conversely, don't split a single thought that happens to span three sentences.
"Battery drains in 1h15m / Freed didn't have this problem / she went back to web"
is **one** item about battery drain — the comparison and the consequence are
evidence for the same finding, not separate findings.

## What to skip

- Channel logistics: "I created this channel", "@X please give them Zendesk access"
- Pure scheduling: onsite dates, who's attending, survey send reminders
- Link-only posts with no content of their own — unless the link is a cross-post,
  in which case follow it (below)
- Usage statistics with no interpretation. But **do** keep a stat when it carries
  a finding: "recordings 96 → notes 75, the drop is unsupported client setups" is
  an item, because the drop is the feedback.
- Internal agreement noise in threads ("agree 100%", ":+1:")

## Praise is feedback

It's tempting to log only complaints. Don't. "Patient instructions are highly
accurate and rarely edited" tells you what not to break, and "DTC cancelled their
Freed contract" is the single strongest retention signal in a year of posts. File
praise under `GOALS`.

Direct quotes are worth preserving verbatim inside `content` — they're what gets
quoted back in roadmap reviews. Keep the speaker's actual words rather than
paraphrasing them into blandness.

## Writing the one-liner

The one-liner is what shows in the Hub's list view, and it's half the upsert key,
so it has to be both scannable and distinct.

Make it a **finding, not a topic**. It should state what is true, so a reader can
triage without opening the row.

- Weak: `Mobile app feedback` — a topic; tells you nothing
- Strong: `Battery drain is the biggest mobile blocker - drove her back to web`

Aim for roughly 60–90 characters. Lead with the subject, not the person — the name
lives in `speaker` and gets prepended to the content anyway.

Because `(client, oneLiner)` is the Hub's row id, two similar items for the same
client need genuinely different one-liners. If two posts six months apart raise
the same ICD-search complaint, distinguish them by their specifics
(`ICD search still rigid - wants semantic/fuzzy matching`) rather than emitting
the same sentence twice, or the second import will overwrite the first.

## Writing the content

Self-contained: someone reading the row a year from now has no memory of the post.
Include the concrete detail — numbers, MRNs, condition names, what was tried, what
the workaround was. That specificity is what makes an item usable as evidence
later.

Resolve Slack markup as you go: `<@U01MMPXUPJM|Adi Gilad>` becomes `Adi Gilad`,
`<https://…|here>` becomes plain text or is dropped. Raw mention IDs in the Hub
are noise.

## The date is when the feedback happened, not when it was posted

This is the easiest field to get quietly wrong. These channels are recaps, so the
post almost always lags the conversation — a Tuesday onsite gets written up on
Wednesday, a survey that ran for six weeks gets shared once at the end. Using the
post date compresses everything toward the write-up and makes "what were clients
telling us in Q1" subtly wrong.

So read the date out of the content, and fall back to the post date only when the
content gives you nothing:

- An explicit meeting date in the title or first line — `"Bi-weekly with HHHN
  02/26/26"`, `"6/17 Feedback Session w Dr. Perez"`, `"CareMore Quality Onsite |
  06/22/26"`, `"Weekly Sync — July 8, 2026"`. Use it.
- A relative reference — `"feedback session yesterday"`, `"we had a call today"`.
  Resolve it against the post date.
- A survey or anything spanning a window: use the close or snapshot date, not the
  date the deck was shared, and say which in the content.
- A cross-post: date it by the **original** meeting, not by when it was forwarded
  into the tracked channel. A QBR held May 18 and forwarded May 25 is May 18.
- Nothing stated at all: the post date is the honest estimate. Don't invent
  precision.

Two ambiguities worth care. Navina writes dates **day/month** in these channels
(`"HHHN sync 4/12"` posted Dec 7 means 4 December, not 12 April) — sanity-check
against the post date, since the meeting is nearly always shortly *before* it.
And if a shift would move a date *forward* past its post date, you've misread the
format; feedback cannot postdate its own write-up.

## Attribution

`speaker` is who gave the feedback — the client, provider or clinic contact.
`reporter` is the Navina person who posted the recap. They are never the same
person; conflating them makes it look like Navina is its own customer.

Feedback relayed second-hand keeps the chain: `Dr. Borges (via Dr. Gallagher)`.
It matters for weighting — reported-by-a-colleague is weaker evidence than
first-hand.

## Threads

Read the thread whenever a post has replies. Extract an item when a reply carries
**client** feedback the parent didn't — a follow-up detail, a correction, an
example the client sent afterwards.

Skip internal Navina discussion in replies. It's often the most interesting
reading in the channel (strategy debate, competitive worry) but it isn't client
feedback, and mixing it in means the Hub can no longer answer "what have clients
actually told us". If a thread is purely internal, extract nothing and still
commit the parent as processed.

Judgment call worth making explicitly: an internal person relaying what a client
said **is** client feedback. An internal person giving their own opinion is not.

## Cross-posts

A post whose whole body is `Cross posting: <link>` has its content in another
channel. Follow it — some of the strongest feedback arrives this way.

The Slack MCP returns only top-level text, not the rendered preview a human sees,
so the link must actually be fetched. To read one specific message, bracket its
timestamp:

```
slack_read_channel(channel_id=<target>, oldest=<ts minus 0.000001>,
                   latest=<ts plus 0.000001>, limit=1)
```

A permalink of the form `/archives/C0AU3CWS29Y/p1781745828545989` decodes as
channel `C0AU3CWS29Y`, ts `1781745828.545989` — insert the decimal point six
digits from the end.

Set `sourceUrl` to the **original channel post**, not the cross-posted target, so
the item traces back to the channel being tracked. Note the true origin in the
content when it adds context (which client channel it came from).

## Client names

Use the account name consistently — the Hub matches items to its Account table, so
`HHHN` and `Hudson Headwaters` becoming two clients defeats the point. Names seen
in this channel: `HHHN`, `DTC Family Health`, `First Valley Medical Group`,
`Harbor Health`.

Leave `client` blank for genuinely cross-client or internal items rather than
guessing. A wrong client attribution is harder to spot later than a missing one.
