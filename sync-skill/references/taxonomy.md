# Hub taxonomy and CSV contract

Everything here mirrors the live Insights Hub (`~/Documents/navina-insights-hub`).
If the Hub's vocabularies change, `src/lib/labels.ts` and `src/lib/personas.ts` are
the source of truth — update this file and `scripts/build_csv.py` together.

## Contents
- [CSV columns](#csv-columns)
- [Product areas](#product-areas)
- [Themes](#themes)
- [Persona roles](#persona-roles)
- [Four ways the import silently goes wrong](#four-ways-the-import-silently-goes-wrong)

## CSV columns

Exact order the Hub's importer destructures (`src/app/api/import/route.ts`):

```
productArea, theme, persona, oneLiner, content, date, wtp, source, client, sourceUrl, reporter
```

- `productArea` — one or more area keys joined with `;`
- `theme` — exactly one theme key
- `persona` — canonical role names joined with `, `
- `oneLiner` — required; a blank one makes the Hub skip the row
- `content` — the full item text, with the speaker's name prepended
- `date` — `YYYY-MM-DD`, the date of the Slack post
- `wtp` — willingness-to-pay; almost always empty
- `source` — e.g. `Slack #ambient-product-insights`
- `client` — account name; blank for internal or cross-client items
- `sourceUrl` — Slack permalink to the exact message, on **`https://navina-workspace.slack.com`**
  (`/archives/<channel id>/p<ts without the dot>`). Never `navina.slack.com`: that is not
  this workspace's domain, and the importer won't overwrite a row once it exists, so a wrong
  link can only be fixed in the database. Take the domain from a real permalink if in doubt
  (`slack_send_message` returns one).
- `reporter` — the Navina person who posted it

## Product areas

Keys, with how they render: `POP_HEALTH` (Pop health), `QUALITY` (Quality),
`ANALYTICS` (Analytics), `AGENTIC` (Agentic), `RISK_DX` (**Risk Adjustment** —
the key stays `RISK_DX` for historical reasons), `AMBIENT` (Ambient),
`COST_AND_UTILIZATION`, `HOSPITALIZATION`, `POINT_OF_CARE` (Point of care),
`PAYERS`, `CARE_MANAGEMENT`, `CODERS` (Coders), `GENERAL`, `COMPETITIVE`.

Which to reach for:

- `AMBIENT` — the scribe itself: recording, note generation, HPI/A&P structure, push to EHR
- `CODERS` — ICD matching and search, E/M and visit codes, the coding dropdown
- `COMPETITIVE` — a named rival (Freed, Nabla, Suki, Heidi, OpenEvidence, Athena Sage)
- `RISK_DX` — diagnosis insights, autodoc, HCC capture, suspected conditions
- `AGENTIC` — orders, referrals, letters, anything the product should *do* rather than write
- `ANALYTICS` — usage reporting, adoption dashboards, per-provider trends
- `POINT_OF_CARE` — documents tab, clinical summary, chart review outside the scribe
- `QUALITY` — measures, quality gaps, auditable documentation

Multiple areas are normal and useful — an ICD-search complaint inside the note
editor is genuinely `AMBIENT;CODERS`. Two is typical, three is a sign the item
should be split.

## Themes

One per item: `WORKFLOW`, `DATA_INTEGRATION`, `TRUST`, `PAIN_POINTS`, `GOALS`,
`PRICING_WTP`, `AGENTIC`, `OTHER`.

The distinctions that actually get confused:

- `PAIN_POINTS` — something is broken, missing, or annoying **today**
- `GOALS` — something wanted, or praise for something that works (both are "the goal state")
- `WORKFLOW` — how they actually work: devices, rooms, sequence, who does what
- `TRUST` — accuracy and safety: hallucinations, omissions, attribution, legal exposure
- `DATA_INTEGRATION` — data not flowing: labs missing, push failures, EHR sync

`TRUST` over `PAIN_POINTS` when the complaint is that output was *wrong* rather
than inconvenient. Wrong content erodes willingness to use the product at all, so
it's worth being able to filter for it separately.

## Persona roles

Only these strings, joined with `, `:

```
Provider · Nurse/MA · Coder · Coder manager · Clinic manager · Quality team
Care Manager/Pop team · VBC Leader · Analytics / Data · Leadership · Admin · Other
```

The Hub derives filter roles by regex over the persona text, so writing the exact
role names is what makes an item reachable. Mapping conventions:

- Any physician, `Dr. X`, NP or PA → `Provider` (NPs and PAs prescribe)
- RN, LPN, MA, scribes → `Nurse/MA`, except **scribes → `Admin`** per the Hub's own regex
- CMO / medical director / CEO / COO / "head of X" → `Leadership`, **plus** `Provider` if they also see patients
- A provider who also runs the practice → `Provider, Clinic manager`
- Navina's own staff → `Other`, so internal opinion never inflates client counts
- A bare name you cannot place → ask, rather than guessing a role

Put the person's **name in `speaker`**, not in persona. `build_csv.py` prepends it
to the content so the name survives while the persona column stays filterable.

## Five ways the import silently goes wrong

None of these produce an error at import time, which is exactly why they're worth
knowing. `build_csv.py` blocks all five.

**0. The theme column takes labels, not keys.** The one that actually bit us, for
162 rows. `mapTheme()` in the import route is a lookup keyed on lowercased
display labels (`"pain points"`), falling back to `OTHER`. Unlike
`mapProductArea`, it has **no passthrough for already-canonical keys**. So
`WORKFLOW`, `TRUST`, `GOALS` and `AGENTIC` survive by coincidence — one word, key
equals label once lowercased — while `PAIN_POINTS` and `DATA_INTEGRATION` match
nothing and land as `OTHER`. `build_csv.py` translates via `THEME_WIRE` on the way
out; work in canonical keys everywhere else.

The Hub's own CSV export writes `r.theme` raw, so its export → import round trip
loses the same two themes. Don't take the export's format as authoritative.

**1. Comma-separated areas.** The importer splits the area cell on `;` or `|`
only. `"AMBIENT,CODERS"` arrives as one string and becomes a junk area named
"Ambient coders". Always join with `;`.

**2. A theme in the area column.** `DATA_INTEGRATION` is the usual culprit since
it sounds like a product area. Unknown area keys aren't rejected — they become new
custom areas that then show up in every dashboard until someone cleans them out.

**3. A persona the regex can't recover.** Write `Provider, Clinic manager` and
both filters find it. Write `Practice lead` and the item answers no persona filter
at all — worse than leaving it blank, because it looks labelled.

**4. Two items sharing (client, oneLiner).** The row id is a hash of client +
one-liner and the route upserts, so the second silently overwrites the first and
you lose an item with no warning. Reword one of the one-liners.

## One more thing about re-importing

The route creates with `update: {}` — an upsert that does nothing on conflict. So
re-importing a corrected CSV **will not update rows that already exist**. If you
need to fix already-imported items, delete them in the Hub first, then import.
